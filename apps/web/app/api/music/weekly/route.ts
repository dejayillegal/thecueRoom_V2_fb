import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { globalCache } from '@/../../../../packages/edge/src/lib/cache';
import { parallelFetch } from '@/../../src/lib/fetcher';
import fs from 'fs';
import path from 'path';

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  page: z.coerce.number().min(1).default(1),
  tags: z.string().optional(),
  source: z.enum(['bandcamp', 'soundcloud', 'mixcloud', 'beatport', 'all']).default('all'),
});

interface MusicItem {
  id: string;
  title: string;
  artist: string;
  image: string;
  link: string;
  source: string;
  publishedAt: string;
  tags: string[];
}

async function fetchTestData(): Promise<MusicItem[]> {
  const fixturePath = path.join(process.cwd(), 'tests/fixtures/weekly-music.json');
  const data = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  return data.items || [];
}

async function fetchBandcampReleases(tags?: string): Promise<MusicItem[]> {
  // Mock implementation - in production, would scrape Bandcamp tag pages
  return [];
}

async function fetchSoundCloudTracks(): Promise<MusicItem[]> {
  // Mock implementation - in production, would use SoundCloud API
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      limit: searchParams.get('limit'),
      page: searchParams.get('page'),
      tags: searchParams.get('tags'),
      source: searchParams.get('source'),
    });

    const cacheKey = `weekly-music:${params.page}:${params.limit}:${params.tags || ''}:${params.source}`;

    const cached = globalCache.get<{ items: MusicItem[]; meta: unknown }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    let items: MusicItem[] = [];

    if (process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test') {
      items = await fetchTestData();
    } else {
      const sources = params.source === 'all' 
        ? ['bandcamp', 'soundcloud', 'mixcloud']
        : [params.source];

      const results = await parallelFetch<MusicItem[]>(
        sources.map(s => `https://api.example.com/${s}/latest`),
        {},
        10000
      );

      items = results.flat().filter(Boolean) as MusicItem[];
    }

    if (params.tags) {
      const tagList = params.tags.split(',').map(t => t.trim().toLowerCase());
      items = items.filter(item => 
        item.tags.some(tag => tagList.includes(tag.toLowerCase()))
      );
    }

    const start = (params.page - 1) * params.limit;
    const paginatedItems = items.slice(start, start + params.limit);

    const response = {
      items: paginatedItems,
      meta: {
        page: params.page,
        limit: params.limit,
        total: items.length,
        totalPages: Math.ceil(items.length / params.limit),
      },
    };

    globalCache.set(cacheKey, response, 60000);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Weekly music API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch music data' },
      { status: 500 }
    );
  }
}