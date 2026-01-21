import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Parser from 'rss-parser';
import * as schema from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { extractImageFromPage, scrapeFeed } from './lib/scraper';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

const { feedsItems: feeds, feedsSources: sources, feedsIngestionLog: fetchLogs } = schema;

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'thecueRoom/2.0 Feed Aggregator (contact@thecueroom.com)',
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

const CIRCUIT_THRESHOLD = 3;
const COOLDOWN_BASE_MS = 10 * 60 * 1000;

function generateHash(title: string, link: string): string {
  return crypto
    .createHash('sha256')
    .update(`\${title}|\${link}`)
    .digest('hex');
}

async function extractImageAdvanced(item: any, baseUrl: string, itemLink: string): Promise<string | null> {
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

function extractTags(item: any, sourceTags: string[]): string[] {
  const tags = new Set<string>(sourceTags);

  if (item.categories) {
    const cats = Array.isArray(item.categories) ? item.categories : [item.categories];
    cats.forEach((cat: any) => {
      if (typeof cat === 'string') {
        tags.add(cat.toLowerCase().trim());
      } else if (cat?._) {
        tags.add(cat._.toLowerCase().trim());
      }
    });
  }

  return Array.from(tags).slice(0, 10);
}

async function ingestSourceRSS(source: any, retryCount = 0): Promise<{ imported: number; skipped: number; error?: string }> {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [2000, 4000, 8000];
  const startTime = Date.now();
  const logId = crypto.randomUUID();

  await db.insert(fetchLogs).values({
    id: logId,
    sourceId: source.id,
    startedAt: new Date(),
    status: 'running',
    itemsProcessed: 0,
    itemsNew: 0,
  });

  try {
    console.log(`📥 Fetching RSS: \${source.name}`);

    const feed = await parser.parseURL(source.url);
    const baseUrl = new URL(source.url).origin;

    let imported = 0;
    let skipped = 0;

    const items = feed.items.slice(0, 50);

    for (const item of items) {
      if (!item.title || !item.link) {
        skipped++;
        continue;
      }

      const hash = generateHash(item.title, item.link);

      const existing = await db
        .select()
        .from(feeds)
        .where(eq(feeds.contentHash, hash))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const image = await extractImageAdvanced(item, baseUrl, item.link);
      const itemAny = item as any;
      const summary = cleanText(item.contentSnippet || item.summary || itemAny.description || '').slice(0, 500);
      const content = cleanText(item.content || item['content:encoded'] || '').slice(0, 5000);
      const tags = extractTags(item, source.tags || []);

      let publishedAt: Date;
      try {
        publishedAt = new Date(item.isoDate || item.pubDate || Date.now());
        if (isNaN(publishedAt.getTime())) {
          publishedAt = new Date();
        }
      } catch {
        publishedAt = new Date();
      }

      await db.insert(feeds).values({
        sourceId: source.id,
        externalId: item.guid || item.link,
        title: item.title.trim().slice(0, 500),
        summary,
        content: content || '',
        link: item.link,
        image: image || '',
        tags,
        publishedAt,
        contentHash: hash,
        rawData: {
          author: item.creator || itemAny.author || null,
          guid: item.guid || null,
        },
      });

      imported++;
    }

    const fetchTime = Date.now() - startTime;

    await db
      .update(sources)
      .set({ 
        lastFetchedAt: new Date(),
        consecutiveFailures: 0,
      })
      .where(eq(sources.id, source.id));

    await db.update(fetchLogs).set({
      finishedAt: new Date(),
      status: 'success',
      itemsProcessed: items.length,
      itemsNew: imported,
    }).where(eq(fetchLogs.id, logId));

    console.log(`✅ \${source.name}: \${imported} new, \${skipped} duplicates (\${fetchTime}ms)`);

    return { imported, skipped };

  } catch (error: any) {
    if (retryCount < MAX_RETRIES && (error.code === 'ETIMEDOUT')) {
      const delay = RETRY_DELAYS[retryCount];
      console.log(`⚠️  \${source.name}: Retry \${retryCount + 1}/\${MAX_RETRIES} in \${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return ingestSourceRSS(source, retryCount + 1);
    }

    const errorMsg = error.message || String(error);
    const newFailures = (source.consecutiveFailures || 0) + 1;

    await db.update(sources).set({
      lastFetchedAt: new Date(),
      consecutiveFailures: newFailures,
    }).where(eq(sources.id, source.id));

    await db.update(fetchLogs).set({
      finishedAt: new Date(),
      status: 'failed',
      errorMessage: errorMsg.slice(0, 500),
    }).where(eq(fetchLogs.id, logId));

    console.error(`❌ \${source.name}: \${errorMsg}`);
    return { imported: 0, skipped: 0, error: errorMsg };
  }
}

async function ingestSourceScrape(source: any): Promise<{ imported: number; skipped: number; error?: string }> {
  const startTime = Date.now();
  const logId = crypto.randomUUID();

  await db.insert(fetchLogs).values({
    id: logId,
    sourceId: source.id,
    startedAt: new Date(),
    status: 'running',
    itemsProcessed: 0,
    itemsNew: 0,
  });

  try {
    console.log(`🕷️  Scraping: \${source.name}`);

    const scrapedItems = await scrapeFeed(source.url, source.config || {});

    let imported = 0;
    let skipped = 0;

    for (const item of scrapedItems) {
      const hash = generateHash(item.title, item.link);

      const existing = await db
        .select()
        .from(feeds)
        .where(eq(feeds.contentHash, hash))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(feeds).values({
        sourceId: source.id,
        externalId: item.link,
        title: item.title.trim().slice(0, 500),
        summary: item.summary || '',
        content: '',
        link: item.link,
        image: item.image || '',
        tags: source.tags || [],
        publishedAt: item.publishedAt || new Date(),
        contentHash: hash,
      });

      imported++;
    }

    const fetchTime = Date.now() - startTime;

    await db
      .update(sources)
      .set({ 
        lastFetchedAt: new Date(),
        consecutiveFailures: 0,
      })
      .where(eq(sources.id, source.id));

    await db.update(fetchLogs).set({
      finishedAt: new Date(),
      status: 'success',
      itemsProcessed: scrapedItems.length,
      itemsNew: imported,
    }).where(eq(fetchLogs.id, logId));

    console.log(`✅ \${source.name}: \${imported} new, \${skipped} duplicates (scraped, \${fetchTime}ms)`);

    return { imported, skipped };

  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const newFailures = (source.consecutiveFailures || 0) + 1;

    await db.update(sources).set({
      lastFetchedAt: new Date(),
      consecutiveFailures: newFailures,
    }).where(eq(sources.id, source.id));

    await db.update(fetchLogs).set({
      finishedAt: new Date(),
      status: 'failed',
      errorMessage: errorMsg.slice(0, 500),
    }).where(eq(fetchLogs.id, logId));

    console.error(`❌ \${source.name}: \${errorMsg}`);
    return { imported: 0, skipped: 0, error: errorMsg };
  }
}

async function ingestSource(source: any) {
  if (source.kind === 'scrape') {
    return await ingestSourceScrape(source);
  } else {
    const rssResult = await ingestSourceRSS(source);

    if (rssResult.error && source.config?.fallbackToScrape) {
      console.log(`   Falling back to scraping for \${source.name}...`);
      return await ingestSourceScrape(source);
    }

    return rssResult;
  }
}

async function ingestBatch(sourcesToIngest: any[], concurrency = 5) {
  const results = {
    totalImported: 0,
    totalSkipped: 0,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ source: string; error: string }>,
  };

  for (let i = 0; i < sourcesToIngest.length; i += concurrency) {
    const batch = sourcesToIngest.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(source => ingestSource(source))
    );

    batchResults.forEach((result, index) => {
      const source = batch[index];

      if (result.status === 'fulfilled') {
        results.totalImported += result.value.imported;
        results.totalSkipped += result.value.skipped;

        if (result.value.error) {
          results.failed++;
          results.errors.push({ source: source.name, error: result.value.error });
        } else {
          results.successful++;
        }
      } else {
        results.failed++;
        results.errors.push({ source: source.name, error: result.reason?.message || 'Unknown error' });
      }
    });
  }

  return results;
}

export async function runEnhancedIngestion() {
  console.log('🚀 thecueRoom Enhanced Feed Ingestion\n');
  console.log('============================================\n');

  const enabledSources = await db
    .select()
    .from(sources)
    .where(eq(sources.enabled, true));

  if (enabledSources.length === 0) {
    console.log('⚠️  No enabled sources found in database.');
    return { success: false, message: 'No enabled sources' };
  }

  console.log(`📊 Processing \${enabledSources.length} sources (5 parallel batches) with enhanced image extraction...\n`);

  const startTime = Date.now();
  const results = await ingestBatch(enabledSources, 5);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n============================================');
  console.log('📈 Ingestion Summary');
  console.log('============================================');
  console.log(`✅ Successful: \${results.successful}/\${enabledSources.length}`);
  console.log(`❌ Failed: \${results.failed}/\${enabledSources.length}`);
  console.log(`📝 Total items imported: \${results.totalImported}`);
  console.log(`⏭️  Total duplicates skipped: \${results.totalSkipped}`);
  console.log(`⏱️  Duration: \${duration}s`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Sources:');
    results.errors.forEach(({ source, error }) => {
      console.log(`   - \${source}: \${error}`);
    });
  }

  console.log('\n✨ Enhanced ingestion complete!\n');

  return {
    success: true,
    ...results,
    duration: parseFloat(duration),
  };
}

const isMainModule = typeof require !== 'undefined' && require.main === module;

if (isMainModule) {
  runEnhancedIngestion()
    .then(() => client.end())
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
