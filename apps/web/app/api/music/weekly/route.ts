import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from '@/../../packages/edge/src/lib/cache';
import { z } from 'zod';

const WeeklyMusicItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  image: z.string().url(),
  link: z.string().url(),
  source: z.string(),
  publishedAt: z.string(),
  tags: z.array(z.string()),
});

const WeeklyMusicResponseSchema = z.object({
  items: z.array(WeeklyMusicItemSchema),
});

type WeeklyMusicResponse = z.infer<typeof WeeklyMusicResponseSchema>;

const cache = new LRUCache<WeeklyMusicResponse>(10, 300000); // 5 min TTL

const TEST_MODE_DATA: WeeklyMusicResponse = {
  items: [
    {
      id: 'test-1',
      title: 'Deep Underground',
      artist: 'Test Artist',
      image: 'https://picsum.photos/seed/track1/400/400',
      link: 'https://bandcamp.com/track/test',
      source: 'bandcamp',
      publishedAt: new Date().toISOString(),
      tags: ['techno', 'deep'],
    },
    {
      id: 'test-2',
      title: 'Warehouse Vibes',
      artist: 'Another Artist',
      image: 'https://picsum.photos/seed/track2/400/400',
      link: 'https://soundcloud.com/track/test',
      source: 'soundcloud',
      publishedAt: new Date().toISOString(),
      tags: ['house', 'underground'],
    },
  ],
};

export async function GET(request: NextRequest) {
  const cacheKey = 'weekly-music';
  const cached = cache.get(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  const isTestMode = process.env.TEST_MODE === 'true' || !process.env.MUSIC_API_URL;

  if (isTestMode) {
    cache.set(cacheKey, TEST_MODE_DATA);
    return NextResponse.json(TEST_MODE_DATA);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(process.env.MUSIC_API_URL!, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const validated = WeeklyMusicResponseSchema.parse(data);

    cache.set(cacheKey, validated);
    return NextResponse.json(validated);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Weekly music fetch failed:', error);
    cache.set(cacheKey, TEST_MODE_DATA);
    return NextResponse.json(TEST_MODE_DATA);
  }
}

export const dynamic = 'force-dynamic';