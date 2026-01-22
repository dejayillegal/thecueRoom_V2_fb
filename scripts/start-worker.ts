import { db } from '../packages/db/index';
import { feedsItems, feedsSources, feedsState, feedsIngestionLog } from '../packages/db/schema';
import { sql, eq, and, lt, or } from 'drizzle-orm';
import Parser from 'rss-parser';
import pLimit from 'p-limit';
import crypto from 'crypto';

const parser = new Parser({ 
  timeout: 30000,
  headers: {
    'User-Agent': 'thecueRoom-Ingestor/2.0 (Standalone)',
  },
});
const limit = pLimit(5);

function generateHash(title: string, link: string): string {
  return crypto.createHash('sha256').update(`${title}|${link}`).digest('hex');
}

async function processSource(source: any, state: any, workerId: string) {
  const startedAt = new Date();
  
  let itemsProcessed = 0;
  let itemsNew = 0;
  let status: 'success' | 'failed' | 'partial' = 'success' as const;
  let errorMessage: string | undefined;

  try {
    console.log(`[Worker] Processing source: ${source.name} (${source.url})`);
    const feed = await parser.parseURL(source.url);
    const items = feed.items || [];
    itemsProcessed = items.length;

    for (const item of items.slice(0, 50)) {
      if (!item.link || !item.title) continue;
      const hash = generateHash(item.title, item.link);
      
      const existing = await db.select().from(feedsItems).where(eq(feedsItems.contentHash, hash)).limit(1);
      if (existing.length > 0) continue;

      const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
      await db.insert(feedsItems).values({
        sourceId: source.id,
        externalId: hash,
        title: item.title,
        summary: item.contentSnippet?.slice(0, 500) || '',
        content: item.content?.slice(0, 5000) || '',
        link: item.link,
        image: item.enclosure?.url || '',
        tags: item.categories || source.tags || [],
        contentHash: hash,
        publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
      });
      itemsNew++;
    }

    const backoffFactor = Math.pow(2, Math.min(state?.consecutiveFailures || 0, 5));
    const baseInterval = (source.minIntervalMinutes || 60) * 60000;
    const nextPollAt = new Date(Date.now() + (baseInterval * backoffFactor));

    await db.update(feedsState).set({
      lastPolledAt: startedAt,
      nextPollAt,
      consecutiveFailures: 0,
      status: 'healthy',
      updatedAt: new Date(),
    }).where(eq(feedsState.sourceId, source.id));

  } catch (error: any) {
    status = 'failed';
    errorMessage = error.message;
    console.error(`[Worker] Failed to process ${source.name}:`, errorMessage);

    const nextFailCount = (state?.consecutiveFailures || 0) + 1;
    const backoffFactor = Math.pow(2, Math.min(nextFailCount, 6));
    const nextPollAt = new Date(Date.now() + ((source.minIntervalMinutes || 60) * 60000 * backoffFactor));

    await db.update(feedsState).set({
      consecutiveFailures: nextFailCount,
      nextPollAt,
      status: 'error',
      lastError: errorMessage,
      updatedAt: new Date(),
    }).where(eq(feedsState.sourceId, source.id));
  } finally {
    await db.insert(feedsIngestionLog).values({
      sourceId: source.id,
      startedAt,
      finishedAt: new Date(),
      status,
      itemsProcessed,
      itemsNew,
      errorMessage,
    });
  }
}

async function run() {
  const workerId = `worker-${Math.random().toString(36).substring(2, 15)}`;
  
  console.log('🚀 Starting thecueRoom Background Feed Worker cycle...');

  const eligibleSources = await db
    .select({ source: feedsSources, state: feedsState })
    .from(feedsSources)
    .innerJoin(feedsState, eq(feedsSources.id, feedsState.sourceId))
    .where(
      and(
        eq(feedsSources.enabled, true),
        or(
          lt(feedsState.nextPollAt, new Date()),
          sql`${feedsState.nextPollAt} IS NULL`
        )
      )
    )
    .limit(10);

  console.log(`[Worker] Found ${eligibleSources.length} sources to process`);
  for (const { source, state } of eligibleSources) {
    await limit(() => processSource(source, state, workerId));
  }
}

// Run immediately on start
run().catch(console.error);

// Then run every hour
setInterval(() => {
  run().catch(console.error);
}, 60 * 60 * 1000);
