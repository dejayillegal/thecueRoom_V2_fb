import { IngestionService } from '../ingestion';
import { db } from '../index';
import { feedsSources, feedsState, feedsItems, feedsIngestionLog } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Basic Unit Test for IngestionService
 * Run with: pnpm tsx packages/db/tests/ingestion.test.ts
 */
async function testIngestion() {
  console.log('🚀 Starting Ingestion Test...');

  try {
    // 1. Setup Mock Source
    const sourceId = randomUUID();
    await db.insert(feedsSources).values({
      id: sourceId,
      name: 'Test RSS',
      url: 'https://www.theverge.com/rss/index.xml',
      kind: 'rss',
      enabled: true,
      minIntervalMinutes: 1,
    });

    await db.insert(feedsState).values({
      sourceId,
      nextFetchAt: new Date(Date.now() - 1000), // Ready to fetch
    });

    console.log('✅ Mock source created');

    // 2. Run Ingestion
    console.log('⏳ Running ingestion...');
    const results = await IngestionService.run();
    console.log('📊 Results:', JSON.stringify(results, null, 2));

    // 3. Verify Results
    const items = await db.select().from(feedsItems).where(eq(feedsItems.sourceId, sourceId));
    console.log(`✅ Items ingested: ${items.length}`);

    const logs = await db.select().from(feedsIngestionLog).where(eq(feedsIngestionLog.sourceId, sourceId));
    console.log(`✅ Audit logs found: ${logs.length}`);

    // Cleanup
    await db.delete(feedsSources).where(eq(feedsSources.id, sourceId));
    console.log('🧹 Cleanup complete');

    if (items.length > 0 && logs.length > 0) {
      console.log('🏁 TEST PASSED');
    } else {
      console.log('❌ TEST FAILED: No items or logs found');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ TEST ERRORED:', err);
    process.exit(1);
  }
}

testIngestion();
