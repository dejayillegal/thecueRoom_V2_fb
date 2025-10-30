import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';
import { getArticleImageSync } from '@/src/lib/feed-image';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

const CACHE_TTL = 60;
const ITEMS_PER_PAGE = 24;

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
      gt(feeds.publishedAt, twoWeeksAgo)
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
        link: feeds.url,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        sourceId: feeds.sourceId,
        sourceName: sources.name,
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
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.link || '',
      image: getArticleImageSync({
        image: item.image,
        guid: item.id,
        url: item.link || '',
        title: item.title
      }),
      tags: item.tags || [],
      publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : item.publishedAt?.toISOString(),
      source: item.sourceName || 'Unknown',
    }));

    const nextCursor = hasMore && sanitizedItems.length > 0
      ? `${sanitizedItems[sanitizedItems.length - 1].publishedAt}_${sanitizedItems[sanitizedItems.length - 1].id}`
      : null;

    return NextResponse.json({
      data: sanitizedItems,
      nextCursor,
      hasMore,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Feed API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to fetch feeds', data: [], nextCursor: null, hasMore: false },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}