import { getDbClient } from '../packages/db/client';
import { sources, feeds } from '../packages/db/schema';
import { eq, sql } from 'drizzle-orm';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
  },
});

const POLL_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

async function processFeed(source: any) {
  const db = getDbClient();

  try {
    console.log(`📥 Fetching RSS: ${source.name}`);

    const feed = await parser.parseURL(source.url);

    if (!feed.items || feed.items.length === 0) {
      console.log(`⚠️  ${source.name}: No items found`);
      return { success: false, imported: 0, skipped: 0 };
    }

    let imported = 0;
    let skipped = 0;

    for (const item of feed.items) {
      if (!item.link || !item.title) {
        skipped++;
        continue;
      }

      try {
        // Check if feed item already exists
        const existing = await db
          .select()
          .from(feeds)
          .where(eq(feeds.url, item.link))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Extract image from content or enclosure
        let image = item.enclosure?.url || null;
        if (!image && item.content) {
          const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch) image = imgMatch[1];
        }

        // Parse published date
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        // Extract tags from categories
        const tags = item.categories || [];

        // Insert new feed item
        await db.insert(feeds).values({
          title: item.title,
          summary: item.contentSnippet || item.content?.substring(0, 300) || null,
          url: item.link,
          image,
          tags,
          publishedAt,
          sourceId: source.id,
        });

        imported++;
      } catch (err: any) {
        console.error(`  Error inserting item: ${err.message}`);
        skipped++;
      }
    }

    // Update source last fetch time
    await db
      .update(sources)
      .set({
        lastFetchAt: new Date(),
        consecutiveFailures: 0,
      })
      .where(eq(sources.id, source.id));

    console.log(`✅ ${source.name}: ${imported} new items (${skipped} skipped)`);
    return { success: true, imported, skipped };

  } catch (error: any) {
    console.error(`❌ ${source.name}: ${error.message}`);

    // Update failure count
    try {
      await db
        .update(sources)
        .set({
          consecutiveFailures: sql`${sources.consecutiveFailures} + 1`,
          lastFetchAt: new Date(),
        })
        .where(eq(sources.id, source.id));
    } catch (updateErr) {
      console.error(`  Failed to update source: ${updateErr}`);
    }

    return { success: false, imported: 0, skipped: 0 };
  }
}

async function runWorkerCycle() {
  const db = getDbClient();

  console.log('\n🚀 Starting thecueRoom Background Feed Worker cycle...\n');

  try {
    // Fetch all enabled sources
    const enabledSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, true));

    console.log(`📊 Processing ${enabledSources.length} sources...\n`);

    let totalImported = 0;
    let totalSkipped = 0;
    let successCount = 0;
    let failCount = 0;

    // Process feeds sequentially to avoid overwhelming the database
    for (const source of enabledSources) {
      const result = await processFeed(source);

      if (result.success) {
        successCount++;
        totalImported += result.imported;
        totalSkipped += result.skipped;
      } else {
        failCount++;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✨ Worker cycle complete!');
    console.log(`✅ Successful: ${successCount}/${enabledSources.length}`);
    console.log(`❌ Failed: ${failCount}/${enabledSources.length}`);
    console.log(`📝 Total items imported: ${totalImported}`);
    console.log(`⏭️  Total duplicates skipped: ${totalSkipped}`);

  } catch (error: any) {
    console.error('❌ Worker cycle failed:', error.message);
  }
}

async function startPeriodicWorker() {
  console.log(`⏰ Starting periodic worker (every ${POLL_INTERVAL_MS / 60000} minutes)\n`);

  // Run immediately on start
  await runWorkerCycle();

  // Then run on interval
  setInterval(async () => {
    await runWorkerCycle();
  }, POLL_INTERVAL_MS);
}

// Start the worker
startPeriodicWorker().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});