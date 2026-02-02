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
    let latestFeeds = await db.select().from(feeds).orderBy(desc(feeds.publishedAt)).limit(5);

    // If no feeds, try to trigger an ingestion or use placeholders to avoid "empty" dashboard
    if (latestFeeds.length === 0) {
      console.log('[Dashboard API] No feeds found, providing fallback signals');
      // Fallback signals so the UI doesn't look empty
      latestFeeds = [
        {
          id: 1,
          source: 'thecueRoom',
          title: 'Welcome to the Global News Feed',
          summary: 'Connect your favorite music news sources and stay updated with the latest industry signals.',
          url: '/news',
          thumbnail: 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?auto=format&fit=crop&q=80&w=800',
          publishedAt: new Date(),
        },
        {
          id: 2,
          source: 'Creative Suite',
          title: 'New AI Cover Art Templates Released',
          summary: 'Explore 10+ professional SVG presets for your next release.',
          url: '/ai/cover-art',
          thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=800',
          publishedAt: new Date(),
        }
      ] as any;
    }

    // Spotlight feeds
    const spotlightFeeds = latestFeeds.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      subtitle: item.summary || undefined,
      imageUrl: item.thumbnail || '',
      link: item.url || '#',
      tag: item.source || 'Signal',
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