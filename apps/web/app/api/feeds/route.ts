
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

const CACHE_TTL = 60;
const ITEMS_PER_PAGE = 24;

function sanitizeImageUrl(url: string | null, title: string): string {
  if (!url) {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }

  if (url.includes('youtube.com/embed') || url.includes('youtu.be')) {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }

  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  if (!imageExtensions.test(url) && !url.includes('og:image') && !url.includes('twitter:image')) {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }

  return url;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10));
    const cursor = searchParams.get('cursor');
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getDbClient();

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions = [
      gt(feeds.publishedAt, twoWeeksAgo.toISOString())
    ];

    if (sourceId) {
      conditions.push(eq(feeds.sourceId, sourceId));
    }

    if (category) {
      conditions.push(sql`${sources.tags} @> ARRAY[${category}]::text[]`);
    }

    if (cursor) {
      const [timestamp, id] = cursor.split('_');
      conditions.push(
        sql`(${feeds.publishedAt}, ${feeds.id}) < (${timestamp}, ${id})`
      );
    }

    const query = db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.link,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        source: {
          id: sources.id,
          name: sources.name,
        },
      })
      .from(feeds)
      .leftJoin(sources, eq(feeds.sourceId, sources.id))
      .where(and(...conditions))
      .orderBy(desc(feeds.publishedAt), desc(feeds.id))
      .limit(limit + 1)
      .offset(offset);

    const results = await query;

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, -1) : results;

    const sanitizedItems = items.map(item => ({
      ...item,
      image: sanitizeImageUrl(item.image, item.title),
    }));

    const nextCursor = hasMore && sanitizedItems.length > 0
      ? `${new Date(sanitizedItems[sanitizedItems.length - 1].publishedAt).toISOString()}_${sanitizedItems[sanitizedItems.length - 1].id}`
      : null;

    return NextResponse.json({
      data: sanitizedItems,
      nextCursor,
      hasMore,
    }, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds', data: [], nextCursor: null, hasMore: false },
      { status: 500 }
    );
  }
}
