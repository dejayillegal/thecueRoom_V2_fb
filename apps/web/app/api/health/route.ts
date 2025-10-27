
import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { sources, feeds } from '@thecueroom/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDbClient();
    
    const [lastIngest] = await db
      .select({ lastFetchedAt: sources.lastFetchedAt })
      .from(sources)
      .orderBy(desc(sources.lastFetchedAt))
      .limit(1);

    const allSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, true));

    const workingSources = allSources.filter(
      (s) => !s.circuitOpenUntil || new Date(s.circuitOpenUntil) <= new Date()
    );

    const feedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(feeds);

    const health = {
      status: 'ok',
      db: true,
      worker: {
        running: true,
        lastIngestAt: lastIngest?.lastFetchedAt?.toISOString() || null,
        sources: {
          total: allSources.length,
          working: workingSources.length,
          circuitOpen: allSources.length - workingSources.length,
        },
      },
      feeds: {
        total: Number(feedCount[0]?.count || 0),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(health, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        db: false,
        worker: { running: false },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
