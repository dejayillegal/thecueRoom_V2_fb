
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MOCK_TRACKS = [
  {
    id: '1',
    title: 'Deep Underground',
    artist: 'Test Artist',
    platform: 'bandcamp',
    url: 'https://bandcamp.com/track/test',
    imageUrl: 'https://picsum.photos/seed/track1/400/400',
    tags: ['techno', 'deep'],
  },
  {
    id: '2',
    title: 'Warehouse Vibes',
    artist: 'Another Artist',
    platform: 'soundcloud',
    url: 'https://soundcloud.com/track/test',
    imageUrl: 'https://picsum.photos/seed/track2/400/400',
    tags: ['house', 'underground'],
  },
  {
    id: '3',
    title: 'Midnight Sessions',
    artist: 'DJ Shadow',
    platform: 'mixcloud',
    url: 'https://mixcloud.com/track/test',
    imageUrl: 'https://picsum.photos/seed/track3/400/400',
    tags: ['ambient', 'experimental'],
  },
  {
    id: '4',
    title: 'Bass Frequencies',
    artist: 'Low End Theory',
    platform: 'beatport',
    url: 'https://beatport.com/track/test',
    imageUrl: 'https://picsum.photos/seed/track4/400/400',
    tags: ['bass', 'dubstep'],
  },
  {
    id: '5',
    title: 'Acid Dreams',
    artist: 'Phuture Collective',
    platform: 'bandcamp',
    url: 'https://bandcamp.com/track/acid',
    imageUrl: 'https://picsum.photos/seed/track5/400/400',
    tags: ['acid', 'techno'],
  },
  {
    id: '6',
    title: 'Minimal Space',
    artist: 'Echospace',
    platform: 'soundcloud',
    url: 'https://soundcloud.com/track/minimal',
    imageUrl: 'https://picsum.photos/seed/track6/400/400',
    tags: ['minimal', 'dub'],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    const filteredTracks = !platform || platform === 'all' 
      ? MOCK_TRACKS 
      : MOCK_TRACKS.filter(track => track.platform === platform);

    return NextResponse.json(
      { tracks: filteredTracks },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Weekly music error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks', tracks: [] },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TTLCache } from '@/../../packages/edge/src/lib/cache';
import weeklyMusicFixture from '@/../../tests/fixtures/weekly-music.json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(0).default(0),
  tags: z.string().optional(),
});

const cache = new TTLCache<any>(50, 60000); // 60s TTL

const TEST_MODE = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';

async function fetchFromSources(tags?: string): Promise<any[]> {
  // In production, fetch from real sources with AbortController
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    // Mock implementation - in production would fetch from:
    // - Bandcamp tag RSS
    // - Discogs feed
    // - Mixcloud oEmbed
    // - SoundCloud oEmbed
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      limit: searchParams.get('limit'),
      page: searchParams.get('page'),
      tags: searchParams.get('tags'),
    });

    const cacheKey = `weekly:${params.limit}:${params.page}:${params.tags || 'all'}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    let items;
    if (TEST_MODE) {
      // Use fixture data in test mode
      items = weeklyMusicFixture.items || [];
    } else {
      items = await fetchFromSources(params.tags);
    }

    // Pagination
    const start = params.page * params.limit;
    const end = start + params.limit;
    const paginatedItems = items.slice(start, end);

    const response = {
      items: paginatedItems,
      meta: {
        total: items.length,
        page: params.page,
        limit: params.limit,
        hasMore: end < items.length,
      },
    };

    cache.set(cacheKey, response);

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('Weekly music error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly music', items: [], meta: {} },
      { status: 500 }
    );
  }
}
