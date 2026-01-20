import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources, eventSubmissions, gigs, users } from '@thecueroom/db/schema';
import { eq, gte, count } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { requireRole } from '@/lib/rbac';

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
  // Check for both general admin and specific role check
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roleCheck = await requireRole(request, ['admin']);
  if (!roleCheck.authorized) {
    return roleCheck.error;
  }

  try {
    const db = getDbClient();

    // Combine stats from both versions of the route
    const [totalFeedsResult] = await db.select({ count: count() }).from(feeds);
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [activeFeedsResult] = await db
      .select({ count: count() })
      .from(feeds)
      .where(gte(feeds.publishedAt, thirtyDaysAgo));

    const [totalSourcesResult] = await db.select({ count: count() }).from(sources);
    const [activeSourcesResult] = await db
      .select({ count: count() })
      .from(sources)
      .where(eq(sources.enabled, true));

    const [pendingCount] = await db
      .select({ count: count() })
      .from(eventSubmissions)
      .where(eq(eventSubmissions.status, 'needs_review'));

    const [eventsCount] = await db.select({ count: count() }).from(gigs);

    const [artistsCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'artist'));

    return NextResponse.json({
      stats: {
        totalFeeds: totalFeedsResult.count || 0,
        activeFeeds: activeFeedsResult.count || 0,
        totalSources: totalSourcesResult.count || 0,
        activeSources: activeSourcesResult.count || 0,
      },
      pendingSubmissions: pendingCount?.count || 0,
      totalEvents: eventsCount?.count || 0,
      totalArtists: artistsCount?.count || 0,
      recentActivity: [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
