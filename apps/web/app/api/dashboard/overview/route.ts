import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, feeds } from '@thecueroom/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { DashboardOverview } from '@thecueroom/shared/dashboardSchemas';

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient();
    
    // Total users and artists
    const [usersResult, artistsResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'artist')),
    ]);

    // Latest feeds
    const latestFeeds = await db.select().from(feeds).orderBy(desc(feeds.publishedAt)).limit(5);

    // Spotlight feeds (reuse latest feeds for now as per instructions)
    const spotlightFeeds = latestFeeds.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      subtitle: item.summary || undefined,
      imageUrl: item.image || item.thumbnail || '',
      link: item.url || '#',
      tag: item.source || 'Editorial',
    }));

    const response: DashboardOverview = {
      stats: {
        users: usersResult[0]?.count || 0,
        artists: artistsResult[0]?.count || 0,
        gigsUpcoming: 0,
        threadsCount: 0,
        likes: 0,
      },
      spotlight: spotlightFeeds,
      gigs: [],
      trendingThreads: [],
      monthlyPlaylist: null,
      aiTools: {
        coverArt: { usage: 0, newTemplates: 5, recentCount: 0 },
        epk: { usage: 0, newTemplates: 2, recentCount: 0 },
        meme: { usage: 0, newTemplates: 8, recentCount: 0 },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
}