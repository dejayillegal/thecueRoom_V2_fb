
import { getDbClient } from '@thecueroom/db';
import { feeds, sources } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import Parser from 'rss-parser';
import crypto from 'crypto';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'thecueRoom/2.0 (Feed Aggregator)'
  }
});

const WORKER_INTERVAL_MS = parseInt(process.env.INGEST_INTERVAL_MINUTES || '60', 10) * 60 * 1000;

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
  enclosure?: {
    url?: string;
    type?: string;
  };
}

async function processSingleSource(source: any) {
  const db = getDbClient();
  
  try {
    console.log(`📥 Fetching RSS: ${source.name}`);
    
    const feed = await parser.parseURL(source.url);
    const items = feed.items as FeedItem[];
    
    let imported = 0;
    let duplicates = 0;

    for (const item of items.slice(0, source.maxItems || 20)) {
      if (!item.link) continue;

      const hash = crypto
        .createHash('sha256')
        .update(item.link)
        .digest('hex')
        .substring(0, 16);

      const existing = await db
        .select()
        .from(feeds)
        .where(eq(feeds.urlHash, hash))
        .limit(1);

      if (existing.length > 0) {
        duplicates++;
        continue;
      }

      const thumbnail = item.enclosure?.url || 
        feed.image?.url || 
        extractImageFromContent(item.content || item.contentSnippet || '');

      await db.insert(feeds).values({
        id: crypto.randomUUID(),
        title: item.title || 'Untitled',
        url: item.link,
        urlHash: hash,
        summary: (item.contentSnippet || item.content || '').substring(0, 500),
        thumbnail: thumbnail || null,
        sourceId: source.id,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        tags: item.categories || source.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      imported++;
    }

    await db
      .update(sources)
      .set({ 
        lastFetchedAt: new Date(),
        consecutiveFailures: 0
      })
      .where(eq(sources.id, source.id));

    console.log(`✅ ${source.name}: imported ${imported}, skipped ${duplicates} duplicates`);
    
    return { success: true, imported, duplicates };
  } catch (error) {
    console.error(`❌ ${source.name}:`, error instanceof Error ? error.message : String(error));
    
    await db
      .update(sources)
      .set({ 
        consecutiveFailures: (source.consecutiveFailures || 0) + 1 
      })
      .where(eq(sources.id, source.id));
    
    return { success: false, imported: 0, duplicates: 0 };
  }
}

function extractImageFromContent(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  return null;
}

async function runWorkerCycle() {
  const db = getDbClient();
  const startTime = Date.now();
  
  console.log('\n🚀 Starting thecueRoom Background Feed Worker cycle...\n');

  try {
    const allSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, true));

    console.log(`📊 Processing ${allSources.length} sources...\n`);

    const results = await Promise.allSettled(
      allSources.map(source => processSingleSource(source))
    );

    let totalSuccess = 0;
    let totalFailed = 0;
    let totalImported = 0;
    let totalDuplicates = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        totalSuccess++;
        totalImported += result.value.imported;
        totalDuplicates += result.value.duplicates;
      } else {
        totalFailed++;
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✨ Worker cycle complete!');
    console.log(`✅ Successful: ${totalSuccess}/${allSources.length}`);
    console.log(`❌ Failed: ${totalFailed}/${allSources.length}`);
    console.log(`📝 Total items imported: ${totalImported}`);
    console.log(`⏭️  Total duplicates skipped: ${totalDuplicates}`);
    console.log(`⏱️  Cycle duration: ${duration}s\n`);
  } catch (error) {
    console.error('💥 Worker cycle failed:', error);
  }
}

async function startPeriodicWorker() {
  console.log(`⏰ Starting periodic worker (every ${WORKER_INTERVAL_MS / 60000} minutes)\n`);
  
  await runWorkerCycle();
  
  setInterval(async () => {
    await runWorkerCycle();
  }, WORKER_INTERVAL_MS);
}

startPeriodicWorker().catch(error => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});
