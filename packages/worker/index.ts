import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Parser from 'rss-parser';
import Bottleneck from 'bottleneck';
import cron from 'node-cron';
import pino from 'pino';
import { sources, feeds, fetchLogs } from '../db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import crypto from 'crypto';
import got from 'got';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  logger.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema: { sources, feeds, fetchLogs } });

const CIRCUIT_THRESHOLD = parseInt(process.env.CIRCUIT_THRESHOLD || '3');
const COOLDOWN_BASE_MS = 10 * 60 * 1000; // 10 minutes
const STARTUP_PARALLELISM = parseInt(process.env.STARTUP_PARALLELISM || '20');
const STEADY_PARALLELISM = parseInt(process.env.STEADY_PARALLELISM || '3');
const MAX_ITEMS_PER_FEED = 50;

const limiterGroups = new Bottleneck.Group({
  maxConcurrent: 2,
  minTime: 500,
});

interface FetchResult {
  sourceId: string;
  success: boolean;
  itemsAdded: number;
  status: string;
  errorMessage?: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

function generateHash(title: string, link: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${link}`)
    .digest('hex');
}

function extractImage(item: any, baseUrl: string): string | null {
  try {
    if (item.enclosure?.url && item.enclosure.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return item.enclosure.url;
    }

    if (item['media:content']?.$?.url) {
      return item['media:content'].$.url;
    }

    if (item['media:thumbnail']?.$?.url) {
      return item['media:thumbnail'].$.url;
    }

    if (item.image?.url) {
      return item.image.url;
    }

    const content = item.content || item['content:encoded'] || item.description || '';
    
    const ogImageMatch = content.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1] && ogImageMatch[1].startsWith('http')) {
      return ogImageMatch[1];
    }

    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      const src = imgMatch[1];
      if (src.startsWith('http')) {
        return src;
      }
      try {
        return new URL(src, baseUrl).href;
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

function cleanText(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSource(source: any): Promise<FetchResult> {
  const startTime = Date.now();
  const logEntry = {
    sourceId: source.id,
    startedAt: new Date(),
    status: 'pending',
    httpStatus: null,
    errorMessage: null,
  };

  try {
    const now = new Date();
    
    if (source.circuitOpenUntil && new Date(source.circuitOpenUntil) > now) {
      logger.warn({ sourceId: source.id, name: source.name }, 'Circuit breaker open, skipping');
      return {
        sourceId: source.id,
        success: false,
        itemsAdded: 0,
        status: 'SKIPPED_CIRCUIT',
      };
    }

    if (source.lastFetchedAt) {
      const minInterval = source.minIntervalMs || 600000; // 10 minutes default
      const timeSinceLastFetch = now.getTime() - new Date(source.lastFetchedAt).getTime();
      if (timeSinceLastFetch < minInterval) {
        logger.debug({ sourceId: source.id, name: source.name }, 'Too soon to fetch again');
        return {
          sourceId: source.id,
          success: false,
          itemsAdded: 0,
          status: 'SKIPPED_INTERVAL',
        };
      }
    }

    const domain = new URL(source.url).hostname;
    const limiter = limiterGroups.key(domain);

    const result = await limiter.schedule(async () => {
      logger.info({ sourceId: source.id, name: source.name }, 'Fetching feed');

      const requestOptions: any = {
        timeout: {
          request: 10000,
        },
        headers: {
          'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        retry: {
          limit: 3,
          methods: ['GET'],
          statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
        },
      };

      if (source.etag) {
        requestOptions.headers['If-None-Match'] = source.etag;
      }
      if (source.lastModified) {
        requestOptions.headers['If-Modified-Since'] = source.lastModified;
      }

      let response;
      try {
        response = await got(source.url, requestOptions);
      } catch (error: any) {
        if (error.response?.statusCode === 304) {
          logger.info({ sourceId: source.id }, 'Feed not modified (304)');
          await db
            .update(sources)
            .set({ lastFetchedAt: now })
            .where(eq(sources.id, source.id));
          
          return {
            sourceId: source.id,
            success: true,
            itemsAdded: 0,
            status: 'NOT_MODIFIED',
          };
        }
        throw error;
      }

      logEntry.httpStatus = response.statusCode;

      const feed = await parser.parseString(response.body);
      const baseUrl = new URL(source.url).origin;

      let itemsAdded = 0;
      const itemsToProcess = feed.items.slice(0, MAX_ITEMS_PER_FEED);

      for (const item of itemsToProcess) {
        if (!item.title || !item.link) continue;

        const hash = generateHash(item.title, item.link);
        
        const existing = await db
          .select()
          .from(feeds)
          .where(eq(feeds.contentHash, hash))
          .limit(1);

        if (existing.length > 0) continue;

        const image = extractImage(item, baseUrl);
        const summary = cleanText(item.contentSnippet || item.summary || '').slice(0, 500);
        const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

        await db.insert(feeds).values({
          sourceId: source.id,
          title: item.title,
          summary,
          content: cleanText(item.content || item['content:encoded'] || ''),
          link: item.link,
          image,
          tags: source.tags || [],
          publishedAt: new Date(publishedAt),
          contentHash: hash,
        });

        itemsAdded++;
      }

      const etag = response.headers.etag || null;
      const lastModified = response.headers['last-modified'] || null;

      await db
        .update(sources)
        .set({
          lastFetchedAt: now,
          lastSuccessAt: now,
          consecutiveFailures: 0,
          etag,
          lastModified,
          lastStatusCode: response.statusCode,
        })
        .where(eq(sources.id, source.id));

      logger.info(
        { sourceId: source.id, name: source.name, itemsAdded },
        'Successfully fetched feed'
      );

      return {
        sourceId: source.id,
        success: true,
        itemsAdded,
        status: 'SUCCESS',
      };
    });

    logEntry.status = 'success';
    await db.insert(fetchLogs).values({
      ...logEntry,
      finishedAt: new Date(),
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const consecutiveFailures = (source.consecutiveFailures || 0) + 1;
    
    logger.error(
      { sourceId: source.id, name: source.name, error: error.message, duration },
      'Failed to fetch feed'
    );

    let circuitOpenUntil = null;
    if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
      const cooldownMs = COOLDOWN_BASE_MS * Math.pow(2, consecutiveFailures - CIRCUIT_THRESHOLD);
      circuitOpenUntil = new Date(Date.now() + cooldownMs);
      logger.warn(
        { sourceId: source.id, circuitOpenUntil, consecutiveFailures },
        'Circuit breaker triggered'
      );
    }

    await db
      .update(sources)
      .set({
        lastFetchedAt: new Date(),
        consecutiveFailures,
        lastStatusCode: error.response?.statusCode || null,
        circuitOpenUntil,
      })
      .where(eq(sources.id, source.id));

    logEntry.status = 'error';
    logEntry.errorMessage = error.message;
    await db.insert(fetchLogs).values({
      ...logEntry,
      finishedAt: new Date(),
    });

    return {
      sourceId: source.id,
      success: false,
      itemsAdded: 0,
      status: 'ERROR',
      errorMessage: error.message,
    };
  }
}

async function fetchAllSources(parallelism: number = STEADY_PARALLELISM): Promise<void> {
  logger.info({ parallelism }, 'Starting feed fetch cycle');

  const allSources = await db
    .select()
    .from(sources)
    .where(eq(sources.enabled, true));

  logger.info({ count: allSources.length }, 'Found enabled sources');

  const batches: any[][] = [];
  for (let i = 0; i < allSources.length; i += parallelism) {
    batches.push(allSources.slice(i, i + parallelism));
  }

  let totalAdded = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(source => fetchSource(source))
    );

    for (const result of results) {
      totalAdded += result.itemsAdded;
      if (result.success) {
        totalSuccess++;
      } else if (result.status.startsWith('SKIPPED')) {
        totalSkipped++;
      } else {
        totalFailed++;
      }
    }
  }

  logger.info(
    { totalAdded, totalSuccess, totalFailed, totalSkipped },
    'Feed fetch cycle complete'
  );
}

async function startupFetch(): Promise<void> {
  logger.info('Running startup fetch with high parallelism');
  await fetchAllSources(STARTUP_PARALLELISM);
}

function scheduleJobs(): void {
  cron.schedule('*/10 * * * *', async () => {
    logger.debug('Running scheduled feed fetch (every 10 minutes)');
    await fetchAllSources(STEADY_PARALLELISM);
  });

  cron.schedule('0 */6 * * *', async () => {
    logger.debug('Running periodic cleanup (every 6 hours)');
    
    const result = await db
      .update(sources)
      .set({ circuitOpenUntil: null, consecutiveFailures: 0 })
      .where(
        and(
          sql`${sources.circuitOpenUntil} IS NOT NULL`,
          lt(sources.circuitOpenUntil, new Date())
        )
      );
    
    logger.info({ cleared: result.count }, 'Circuit breaker cleanup complete');
  });

  logger.info('Scheduled jobs initialized');
}

export async function startWorker(): Promise<void> {
  logger.info('Starting background worker service');

  await startupFetch();

  scheduleJobs();

  logger.info('Background worker running');
}

if (require.main === module) {
  startWorker().catch((error) => {
    logger.error({ error }, 'Worker crashed');
    process.exit(1);
  });
}
