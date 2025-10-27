import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Parser from 'rss-parser';
import { feeds, sources } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { seedSources } from './seed-sources';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { feeds, sources } });

const parser = new Parser({
  timeout: 30000,
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

function generateHash(title: string, link: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${link}`)
    .digest('hex');
}

function extractImage(item: any, baseUrl: string): string | null {
  try {
    if (item.enclosure?.url) {
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
    if (ogImageMatch && ogImageMatch[1]) {
      const url = ogImageMatch[1];
      return url.startsWith('http') ? url : new URL(url, baseUrl).href;
    }

    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      const src = imgMatch[1];
      return src.startsWith('http') ? src : new URL(src, baseUrl).href;
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

async function ingestSource(source: any, retryCount = 0): Promise<{ imported: number; skipped: number; error?: string }> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  try {
    console.log(`📥 Fetching: ${source.name}`);

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

      const image = extractImage(item, baseUrl);
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
        title: item.title.trim().slice(0, 500),
        summary,
        content: content || null,
        link: item.link,
        image,
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

    await db
      .update(sources)
      .set({ lastFetchedAt: new Date() })
      .where(eq(sources.id, source.id));

    console.log(`✅ ${source.name}: ${imported} new, ${skipped} duplicates`);
    
    return { imported, skipped };

  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      console.log(`⚠️  ${source.name}: Retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return ingestSource(source, retryCount + 1);
    }

    const errorMsg = error.message || String(error);
    console.error(`❌ ${source.name}: ${errorMsg}`);
    return { imported: 0, skipped: 0, error: errorMsg };
  }
}

async function ingestBatch(sources: any[], concurrency = 5) {
  const results = {
    totalImported: 0,
    totalSkipped: 0,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ source: string; error: string }>,
  };

  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    
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

    if (i + concurrency < sources.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

async function main() {
  console.log('🚀 thecueRoom Feed Ingestion\n');
  console.log('============================================\n');

  console.log('Step 1: Seeding sources...\n');
  await seedSources();

  console.log('\n============================================\n');
  console.log('Step 2: Fetching feeds...\n');

  const allSources = await db
    .select()
    .from(sources)
    .where(eq(sources.enabled, true));

  if (allSources.length === 0) {
    console.log('⚠️  No enabled sources found in database.');
    await client.end();
    return;
  }

  console.log(`📊 Processing ${allSources.length} sources with parallel fetching...\n`);

  const startTime = Date.now();
  const results = await ingestBatch(allSources, 5);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n============================================');
  console.log('📈 Ingestion Summary');
  console.log('============================================');
  console.log(`✅ Successful: ${results.successful}/${allSources.length}`);
  console.log(`❌ Failed: ${results.failed}/${allSources.length}`);
  console.log(`📝 Total items imported: ${results.totalImported}`);
  console.log(`⏭️  Total duplicates skipped: ${results.totalSkipped}`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Sources:');
    results.errors.forEach(({ source, error }) => {
      console.log(`   - ${source}: ${error}`);
    });
  }

  console.log('\n✨ Ingestion complete!\n');
  await client.end();
}

const isMainModule = typeof require !== 'undefined' && require.main === module;

if (isMainModule) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as ingestAll };
