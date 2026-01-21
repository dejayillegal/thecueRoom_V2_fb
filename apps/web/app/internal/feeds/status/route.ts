import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feedsItems, feedsSources, feedsIngestionLog } from '@thecueroom/db/schema';
import { count, sql, desc, and, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDbClient();

    // 1. Total sources
    const [sourcesCountResult] = await db
      .select({ count: count() })
      .from(feedsSources);

    // 2. Last ingestion timestamp
    const [lastIngestionResult] = await db
      .select({ lastIngestion: feedsIngestionLog.startedAt })
      .from(feedsIngestionLog)
      .orderBy(desc(feedsIngestionLog.startedAt))
      .limit(1);

    // 3. Items ingested (last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [itemsCountResult] = await db
      .select({ count: count() })
      .from(feedsItems)
      .where(gte(feedsItems.createdAt, twentyFourHoursAgo));

    // 4. Error count (last 24h)
    const [errorCountResult] = await db
      .select({ count: count() })
      .from(feedsIngestionLog)
      .where(
        and(
          gte(feedsIngestionLog.startedAt, twentyFourHoursAgo),
          sql`${feedsIngestionLog.status} = 'failed'`
        )
      );

    // 5. Active Leases (Multiple Instance Safety Check)
    const [activeLeases] = await db
      .select({ count: count() })
      .from(feedsState)
      .where(gte(feedsState.leaseExpiresAt, new Date()));

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      data: {
        totalSources: Number(sourcesCountResult?.count || 0),
        lastIngestionTimestamp: lastIngestionResult?.lastIngestion || null,
        itemsIngestedLast24h: Number(itemsCountResult?.count || 0),
        errorCountLast24h: Number(errorCountResult?.count || 0),
        activeLeases: Number(activeLeases?.count || 0),
      },
      meta: {
        engine: 'stateless-lease-locking',
        resilience: {
          concurrencyLimit: 5,
          maxItemsPerPoll: 50,
          timeoutMs: 10000,
          backoffEnabled: true
        }
      }
    });
  } catch (error: any) {
    console.error('Feeds status error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to fetch feeds status',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
