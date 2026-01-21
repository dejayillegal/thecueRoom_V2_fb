import { db } from './index';
import { feedsSources, feedsState, feedsItems, feedsIngestionLog } from './schema';
import { eq, and, lt, or, sql, desc, gt } from 'drizzle-orm';

export interface NormalizedItem {
  externalId: string;
  title: string;
  link: string;
  summary?: string;
  content?: string;
  image?: string;
  publishedAt: Date;
  rawData: any;
  tags?: string[];
}

/**
 * IngestionService
 * 
 * Authoritative engine for music news ingestion.
 */
export class IngestionService {
  private static LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  static async getGlobalStatus() {
    const logs = await db
      .select()
      .from(feedsIngestionLog)
      .orderBy(desc(feedsIngestionLog.startedAt))
      .limit(10);
    
    const activeLeases = await db
      .select()
      .from(feedsState)
      .where(gt(feedsState.leaseExpiresAt, new Date()));

    const isRunning = activeLeases.length > 0;
    const hasFailed = logs.some(l => l.status === 'failed');
    const totalItems = logs.reduce((acc, l) => acc + l.itemsNew, 0);

    return {
      isRunning,
      hasFailed,
      lastRun: logs[0]?.finishedAt || logs[0]?.startedAt,
      totalItemsNew: totalItems
    };
  }

  static trigger() {
    this.run().catch(err => {
      console.error('[IngestionService] Background run failed:', err);
    });
  }

  static async run() {
    const workerId = `worker-${Math.random().toString(36).substring(2, 15)}`;
    
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
          ),
          or(
            lt(feedsState.leaseExpiresAt, new Date()),
            sql`${feedsState.leaseExpiresAt} IS NULL`
          )
        )
      )
      .limit(5);

    if (eligibleSources.length === 0) {
      const itemCount = await db.select({ count: sql<number>`count(*)` }).from(feedsItems);
      if (Number(itemCount[0].count) === 0) {
        const allEnabled = await db.select({ source: feedsSources, state: feedsState })
          .from(feedsSources)
          .innerJoin(feedsState, eq(feedsSources.id, feedsState.sourceId))
          .where(eq(feedsSources.enabled, true))
          .limit(5);
        
        for (const { source, state } of allEnabled) {
          await this.processSource(source, state, workerId);
        }
      }
    }

    const results = [];
    for (const { source, state } of eligibleSources) {
      results.push(await this.processSource(source, state, workerId));
    }
    return results;
  }

  private static async processSource(source: any, state: any, workerId: string) {
    const startedAt = new Date();
    
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

    if (acquired.rowCount === 0) return { sourceId: source.id, status: 'skipped' };

    let itemsProcessed = 0;
    let itemsNew = 0;
    let status: 'success' | 'failed' | 'partial' = 'success';
    let errorMessage: string | undefined;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'If-None-Match': state.etag || '',
          'If-Modified-Since': state.lastModified || '',
          'User-Agent': 'thecueRoom-Ingestor/2.0',
        },
      }).finally(() => clearTimeout(timeout));

      if (response.status === 304) {
        status = 'success';
      } else if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      } else {
        const body = await response.text();
        const items = await this.parseContent(body, source.kind);
        
        const limitedItems = items.slice(0, 50);
        itemsProcessed = limitedItems.length;

        for (const item of limitedItems) {
          try {
            const result = await db
              .insert(feedsItems)
              .values({
                sourceId: source.id,
                externalId: item.externalId,
                title: item.title,
                link: item.link,
                summary: item.summary,
                content: item.content,
                image: item.image,
                publishedAt: item.publishedAt,
                rawData: item.rawData,
                tags: item.tags || source.tags || [],
              })
              .onConflictDoNothing({ target: [feedsItems.sourceId, feedsItems.externalId] });
            
            if (result.rowCount && result.rowCount > 0) itemsNew++;
          } catch (itemErr) {
            console.error(`[IngestionService] Failed to save item from ${source.id}:`, itemErr);
            status = 'partial';
          }
        }

        const backoffFactor = Math.pow(2, Math.min(state.consecutiveFailures || 0, 5));
        const baseInterval = source.minIntervalMinutes * 60000;
        const nextPollAt = new Date(Date.now() + (baseInterval * backoffFactor));

        await db
          .update(feedsState)
          .set({
            lastPolledAt: startedAt,
            nextPollAt,
            etag: response.headers.get('etag'),
            lastModified: response.headers.get('last-modified'),
            consecutiveFailures: 0,
            status: 'healthy',
            lastError: null,
            leaseOwner: null,
            leaseExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(feedsState.sourceId, source.id));
      }
    } catch (err: any) {
      status = 'failed';
      errorMessage = err.message;
      
      const nextFailCount = (state.consecutiveFailures || 0) + 1;
      const backoffFactor = Math.pow(2, Math.min(nextFailCount, 6));
      const nextPollAt = new Date(Date.now() + (source.minIntervalMinutes * 60000 * backoffFactor));

      await db
        .update(feedsState)
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

  private static async parseContent(body: string, kind: string): Promise<NormalizedItem[]> {
    const items: NormalizedItem[] = [];
    try {
      if (kind === 'rss' || kind === 'atom') {
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(body)) !== null) {
          const content = match[1];
          const title = content.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || 'Untitled';
          const link = content.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1] || '';
          
          if (!link) continue;

          const guidMatch = content.match(/<guid[\s\S]*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/);
          const guid = guidMatch ? guidMatch[1] : link;
          const pubDateStr = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
          
          let publishedAt = new Date();
          if (pubDateStr) {
            const parsed = new Date(pubDateStr);
            if (!isNaN(parsed.getTime())) publishedAt = parsed;
          }

          items.push({
            externalId: guid.trim(),
            title: this.cleanText(title),
            link: link.trim(),
            publishedAt,
            rawData: { raw: content.substring(0, 5000) },
          });
        }
      } else if (kind === 'json') {
        const data = JSON.parse(body);
        const rawItems = Array.isArray(data.items) ? data.items : 
                        Array.isArray(data.articles) ? data.articles : [];
        
        for (const item of rawItems) {
          const link = item.url || item.link;
          if (!link) continue;

          items.push({
            externalId: String(item.id || link),
            title: String(item.title || 'Untitled'),
            link: String(link),
            summary: item.summary || item.description,
            publishedAt: new Date(item.date_published || item.published_at || Date.now()),
            rawData: item,
          });
        }
      }
    } catch (parseErr) {
      console.error(`[IngestionService] Parsing error for ${kind}:`, parseErr);
    }
    return items;
  }

  private static cleanText(text: string): string {
    return text.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
  }
}
