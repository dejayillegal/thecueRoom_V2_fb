import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { gigs, forumThreads, spotlightItems, playlists, users, aiJobs, memes } from '@thecueroom/db/schema';
import { eq, gte, desc, and, sql } from 'drizzle-orm';
import { getDemoData } from '@thecueroom/server/dashboardAggregators';
import type { DashboardOverview } from '@thecueroom/shared/dashboardSchemas';

export async function GET(request: NextRequest) {
  try {
    const useDemoData = process.env.FEATURE_DASHBOARD_DEMO === 'true' || process.env.NODE_ENV === 'development';

    const db = getDbClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      usersResult,
      artistsResult,
      upcomingGigsResult,
      threadsResult,
      likesResult,
      spotlightResult,
      gigsListResult,
      trendingThreadsResult,
      currentPlaylistResult,
      coverArtJobsResult,
      epkJobsResult,
      memesResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'artist')),
      db.select({ count: sql<number>`count(*)::int` }).from(gigs).where(gte(gigs.startTime, now)),
      db.select({ count: sql<number>`count(*)::int` }).from(forumThreads),
      db.select({ total: sql<number>`COALESCE(sum(${forumThreads.likesCount}), 0)::int` }).from(forumThreads),
      db.select().from(spotlightItems).where(eq(spotlightItems.featured, true)).orderBy(desc(spotlightItems.publishedAt)).limit(5),
      db.select().from(gigs).where(gte(gigs.startTime, now)).orderBy(gigs.startTime).limit(3),
      db.select().from(forumThreads).orderBy(desc(forumThreads.likesCount)).limit(5),
      db.select().from(playlists).where(eq(playlists.status, 'live')).orderBy(desc(playlists.curatedAt)).limit(1),
      db.select({ count: sql<number>`count(*)::int` }).from(aiJobs).where(
        and(
          eq(aiJobs.type, 'cover-art'),
          gte(aiJobs.createdAt, sevenDaysAgo)
        )
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(aiJobs).where(
        and(
          eq(aiJobs.type, 'epk'),
          gte(aiJobs.createdAt, sevenDaysAgo)
        )
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(memes).where(gte(memes.createdAt, sevenDaysAgo)),
    ]);

    const hasData = (usersResult[0]?.count || 0) > 0;

    if (!hasData && useDemoData) {
      console.log('[Dashboard API] No data found, returning demo data');
      return NextResponse.json(getDemoData());
    }

    const response: DashboardOverview = {
      stats: {
        users: usersResult[0]?.count || 0,
        artists: artistsResult[0]?.count || 0,
        gigsUpcoming: upcomingGigsResult[0]?.count || 0,
        threadsCount: threadsResult[0]?.count || 0,
        likes: likesResult[0]?.total || 0,
      },
      spotlight: spotlightResult.map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.excerpt || undefined,
        imageUrl: item.image,
        link: item.link || '#',
        tag: item.category,
      })),
      gigs: gigsListResult.map((gig: any) => ({
        id: gig.id,
        title: gig.title,
        venue: gig.venue,
        city: gig.city || undefined,
        date: gig.startTime.toISOString(),
        isTicketed: !!gig.ticketUrl,
        ticketUrl: gig.ticketUrl || undefined,
      })),
      trendingThreads: trendingThreadsResult.map((thread: any) => ({
        id: thread.id,
        title: thread.title,
        replies: thread.replies,
        likes: thread.likes,
        category: thread.category || undefined,
        author: thread.author || 'anonymous',
        createdAt: thread.createdAt?.toISOString() || new Date().toISOString(),
      })),
      monthlyPlaylist: currentPlaylistResult[0] ? {
        id: currentPlaylistResult[0].id,
        title: currentPlaylistResult[0].title,
        embedUrl: currentPlaylistResult[0].embedUrl || undefined,
        externalUrl: currentPlaylistResult[0].soundcloudUrl || undefined,
        trackCount: undefined,
        curatedAt: currentPlaylistResult[0].curatedAt?.toISOString() || undefined,
      } : null,
      aiTools: {
        coverArt: {
          usage: coverArtJobsResult[0]?.count || 0,
          newTemplates: 5,
          recentCount: coverArtJobsResult[0]?.count || 0,
        },
        epk: {
          usage: epkJobsResult[0]?.count || 0,
          newTemplates: 2,
          recentCount: epkJobsResult[0]?.count || 0,
        },
        meme: {
          usage: memesResult[0]?.count || 0,
          newTemplates: 8,
          recentCount: memesResult[0]?.count || 0,
        },
      },
    };

    if (spotlightResult.length === 0 && useDemoData) {
      const demoDataResult = await getDemoData();
      response.spotlight = demoDataResult.spotlight;
    }

    if (gigsListResult.length === 0 && useDemoData) {
      const demoDataResult = await getDemoData();
      response.gigs = demoDataResult.gigs;
    }

    if (trendingThreadsResult.length === 0 && useDemoData) {
      const demoDataResult = await getDemoData();
      response.trendingThreads = demoDataResult.trendingThreads;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Dashboard API] Error:', error);

    if (process.env.FEATURE_DASHBOARD_DEMO === 'true' || process.env.NODE_ENV === 'development') {
      console.log('[Dashboard API] Error occurred, falling back to demo data');
      return NextResponse.json(getDemoData());
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
}