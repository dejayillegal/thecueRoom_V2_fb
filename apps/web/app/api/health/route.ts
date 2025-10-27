
import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { sources } from '@thecueroom/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDbClient();
    
    const lastIngest = await db
      .select({ lastFetchedAt: sources.lastFetchedAt })
      .from(sources)
      .orderBy(desc(sources.lastFetchedAt))
      .limit(1);

    const health = {
      status: 'ok',
      db: true,
      queue: true,
      lastIngestAt: lastIngest[0]?.lastFetchedAt?.toISOString() || null,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(health, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        db: false,
        queue: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
