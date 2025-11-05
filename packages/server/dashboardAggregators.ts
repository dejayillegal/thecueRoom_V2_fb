import type { DashboardOverview, SpotlightItem, GigItem, TrendingThread, MonthlyPlaylist, AIToolUsage } from '@thecueroom/shared/dashboardSchemas';

export async function getDemoData(): Promise<DashboardOverview> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const nextMonth = new Date(now);
  nextMonth.setDate(nextMonth.getDate() + 30);

  return {
    stats: {
      users: 1250,
      artists: 342,
      gigsUpcoming: 48,
      threadsCount: 156,
      likes: 3420,
    },
    spotlight: [
      {
        id: '1',
        title: 'New Techno Release: Dark Horizons',
        subtitle: 'Listen to the latest from Berlin underground',
        imageUrl: '/api/og-fallback?title=Techno',
        link: '/music/releases/dark-horizons',
        tag: 'New Release',
      },
      {
        id: '2',
        title: 'Upcoming Festival: Digital Dreams 2025',
        subtitle: 'Three days of cutting-edge electronic music',
        imageUrl: '/api/og-fallback?title=Festival',
        link: '/events/digital-dreams',
        tag: 'Festival',
      },
      {
        id: '3',
        title: 'Artist Interview: DJ Pulse',
        subtitle: 'Inside the mind of a rising star',
        imageUrl: '/api/og-fallback?title=Interview',
        link: '/news/dj-pulse-interview',
        tag: 'Interview',
      },
      {
        id: '4',
        title: 'Production Tutorial: Advanced Basslines',
        subtitle: 'Master the art of deep, rolling bass',
        imageUrl: '/api/og-fallback?title=Tutorial',
        link: '/tutorials/advanced-basslines',
        tag: 'Tutorial',
      },
      {
        id: '5',
        title: 'Vinyl Spotlight: Classic House Gems',
        subtitle: 'Rediscover the golden era',
        imageUrl: '/api/og-fallback?title=Vinyl',
        link: '/vinyl/classic-house',
        tag: 'Vinyl',
      },
    ],
    gigs: [
      {
        id: '1',
        title: 'Fabric London - Techno Night',
        venue: 'Fabric',
        city: 'London',
        date: tomorrow.toISOString(),
        isTicketed: true,
        ticketUrl: 'https://example.com/tickets/1',
      },
      {
        id: '2',
        title: 'Printworks: Final Season',
        venue: 'Printworks',
        city: 'London',
        date: nextWeek.toISOString(),
        isTicketed: true,
        ticketUrl: 'https://example.com/tickets/2',
      },
      {
        id: '3',
        title: 'Berghain Showcase',
        venue: 'Berghain',
        city: 'Berlin',
        date: nextMonth.toISOString(),
        isTicketed: false,
      },
    ],
    trendingThreads: [
      {
        id: '1',
        title: 'What DAW do you use for techno production?',
        replies: 45,
        likes: 128,
        category: 'Production',
        author: 'producer_mike',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        title: 'Best clubs for underground house in Europe',
        replies: 67,
        likes: 215,
        category: 'Scene',
        author: 'club_hunter',
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        title: 'Tips for getting your first gig as a DJ',
        replies: 34,
        likes: 92,
        category: 'Career',
        author: 'dj_starter',
        createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        title: 'Vinyl vs Digital: The eternal debate',
        replies: 89,
        likes: 156,
        category: 'Discussion',
        author: 'vinyl_purist',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        title: 'How to promote your tracks on social media',
        replies: 23,
        likes: 67,
        category: 'Marketing',
        author: 'promo_guru',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    monthlyPlaylist: {
      id: '1',
      title: 'November 2025 - Curated Selection',
      embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
      externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
      trackCount: 42,
      curatedAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    },
    aiTools: {
      coverArt: {
        usage: 87,
        newTemplates: 5,
        recentCount: 12,
      },
      epk: {
        usage: 34,
        newTemplates: 2,
        recentCount: 7,
      },
      meme: {
        usage: 156,
        newTemplates: 8,
        recentCount: 23,
      },
    },
  };
}

export async function getAggregatedStats(db: any): Promise<DashboardOverview['stats']> {
  try {
    const [usersCount, artistsCount, gigsCount, threadsCount] = await Promise.all([
      db.select({ count: db.fn.count() }).from(db.schema.users),
      db.select({ count: db.fn.count() }).from(db.schema.users).where(db.eq(db.schema.users.role, 'artist')),
      db.select({ count: db.fn.count() }).from(db.schema.gigs).where(db.gte(db.schema.gigs.startTime, new Date())),
      db.select({ count: db.fn.count() }).from(db.schema.forumThreads),
    ]);

    const likesResult = await db.select({ total: db.sum(db.schema.forumThreads.likesCount) }).from(db.schema.forumThreads);

    return {
      users: usersCount[0]?.count || 0,
      artists: artistsCount[0]?.count || 0,
      gigsUpcoming: gigsCount[0]?.count || 0,
      threadsCount: threadsCount[0]?.count || 0,
      likes: likesResult[0]?.total || 0,
    };
  } catch (error) {
    console.error('Error fetching aggregated stats:', error);
    return {
      users: 0,
      artists: 0,
      gigsUpcoming: 0,
      threadsCount: 0,
      likes: 0,
    };
  }
}
