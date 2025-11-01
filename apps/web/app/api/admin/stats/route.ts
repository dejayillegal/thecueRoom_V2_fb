import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { eq, gte, count } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDbClient();

    const [totalFeedsResult] = await db
      .select({ count: count() })
      .from(feeds);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [activeFeedsResult] = await db
      .select({ count: count() })
      .from(feeds)
      .where(gte(feeds.publishedAt, thirtyDaysAgo));

    const [totalSourcesResult] = await db
      .select({ count: count() })
      .from(sources);

    const [activeSourcesResult] = await db
      .select({ count: count() })
      .from(sources)
      .where(eq(sources.enabled, true));

    return NextResponse.json({
      stats: {
        totalFeeds: totalFeedsResult.count || 0,
        activeFeeds: activeFeedsResult.count || 0,
        totalSources: totalSourcesResult.count || 0,
        activeSources: activeSourcesResult.count || 0,
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
