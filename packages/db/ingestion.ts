import { db } from './index';
import { feedsSources, feedsState, feeds, feedsIngestionLog, feedState as globalFeedState } from './schema';
import { eq, and, lt, or, sql, desc, gt } from 'drizzle-orm';
import Parser from 'rss-parser';

export class IngestionService {
  private static LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  static async getGlobalStatus() {
    try {
      const logs = await db
        .select()
        .from(feedsIngestionLog)
        .orderBy(desc(feedsIngestionLog.startedAt))
        .limit(10);
      
      const statusResult = await db
        .select()
        .from(globalFeedState)
        .where(eq(globalFeedState.id, 1))
        .limit(1);
      const status = statusResult[0];

      const isRunning = status?.ingestLockUntil ? status.ingestLockUntil > new Date() : false;
      const latestLog = logs[0];
      const hasFailed = latestLog?.status === 'failed';

      return {
        isRunning,
        hasFailed,
        lastRun: latestLog?.finishedAt || latestLog?.startedAt || null,
        totalItemsNew: logs.reduce((acc: number, l: any) => acc + (l.itemsNew || 0), 0)
      };
    } catch (err) {
      console.error('[IngestionService] Failed to get status:', err);
      return { isRunning: false, hasFailed: true, lastRun: null, totalItemsNew: 0 };
    }
  }

  static trigger() {
    this.run().catch(err => {
      console.error('[IngestionService] Background run failed:', err);
    });
  }

  static async run() {
    const now = new Date();
    const statusResult = await db.select().from(globalFeedState).where(eq(globalFeedState.id, 1)).limit(1);
    const status = statusResult[0];
    
    if (status?.ingestLockUntil && status.ingestLockUntil > now) {
      return { status: 'locked' };
    }

    await db.insert(globalFeedState).values({ id: 1, ingestLockUntil: new Date(now.getTime() + this.LEASE_DURATION_MS) })
      .onConflictDoUpdate({ 
        target: globalFeedState.id, 
        set: { ingestLockUntil: new Date(now.getTime() + this.LEASE_DURATION_MS) } 
      });

    const workerId = `worker-${Math.random().toString(36).substring(2, 15)}`;
    
    const eligibleSources = await db
      .select({ source: feedsSources, state: feedsState })
      .from(feedsSources)
      .innerJoin(feedsState, eq(feedsSources.id, feedsState.sourceId))
      .where(
        and(
          eq(feedsSources.enabled, true),
          or(
            lt(feedsState.nextPollAt, now),
            sql`${feedsState.nextPollAt} IS NULL`
          ),
          or(
            lt(feedsState.leaseExpiresAt, now),
            sql`${feedsState.leaseExpiresAt} IS NULL`
          )
        )
      )
      .limit(5);

    const results = [];
    for (const { source, state } of eligibleSources) {
      results.push(await this.processSource(source, state, workerId));
    }

    await db.update(globalFeedState)
      .set({ lastIngestedAt: new Date(), ingestLockUntil: null })
      .where(eq(globalFeedState.id, 1));

    return results;
  }

  private static async processSource(source: any, state: any, workerId: string) {
    const startedAt = new Date();
    const parser = new Parser({ timeout: 30000 });
    
    const acquired = await db
      .update(feedsState)
      .set({
        leaseOwner: workerId,
        leaseExpiresAt: new Date(Date.now() + this.LEASE_DURATION_MS),
        status: 'ingesting',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(feedsState.sourceId, source.id),
          or(
            lt(feedsState.leaseExpiresAt, new Date()),
            sql`${feedsState.leaseExpiresAt} IS NULL`
          )
        )
      );

    if (!acquired.rowCount || acquired.rowCount === 0) return { sourceId: source.id, status: 'skipped' };

    let itemsProcessed = 0;
    let itemsNew = 0;
    let status: 'success' | 'failed' | 'partial' = 'success';
    let errorMessage: string | undefined;

    try {
      const feed = await parser.parseURL(source.url);
      const items = feed.items || [];
      itemsProcessed = items.length;

      for (const item of items.slice(0, 50)) {
        try {
          const externalId = item.guid || item.link || item.title;
          if (!externalId || !item.link || !item.title) continue;

          const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
          const contentHash = Buffer.from(`${item.title}|${item.link}`).toString('base64');

          const result = await db
            .insert(feeds)
            .values({
              sourceId: source.id,
              source: source.name,
              title: item.title,
              url: item.link,
              summary: item.contentSnippet || '',
              thumbnailUrl: item.enclosure?.url || '',
              publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
              rawData: item,
              tags: item.categories || source.tags || [],
              contentHash,
            })
            .onConflictDoNothing({ target: [feeds.contentHash] });
          
          if (result.rowCount && result.rowCount > 0) itemsNew++;
        } catch (itemErr) {
          status = 'partial';
        }
      }

      const backoffFactor = Math.pow(2, Math.min(state.consecutiveFailures || 0, 5));
      const nextPollAt = new Date(Date.now() + ((source.minIntervalMinutes || 60) * 60000 * backoffFactor));

      await db.update(feedsState)
        .set({
          lastPolledAt: startedAt,
          nextPollAt,
          consecutiveFailures: 0,
          status: 'healthy',
          lastError: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(feedsState.sourceId, source.id));

    } catch (err: any) {
      status = 'failed';
      errorMessage = err.message;
      const nextFailCount = (state.consecutiveFailures || 0) + 1;
      const backoffFactor = Math.pow(2, Math.min(nextFailCount, 6));
      const nextPollAt = new Date(Date.now() + ((source.minIntervalMinutes || 60) * 60000 * backoffFactor));

      await db.update(feedsState)
        .set({
          consecutiveFailures: nextFailCount,
          nextPollAt,
          status: 'error',
          lastError: errorMessage,
          leaseOwner: null,
          leaseExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(feedsState.sourceId, source.id));
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

    return { sourceId: source.id, status, itemsNew };
  }
}
