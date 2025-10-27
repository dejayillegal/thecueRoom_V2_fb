import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { desc, eq, and, gte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');
    const q = searchParams.get('q');

    const db = getDbClient();

    let query = db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.link,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        createdAt: feeds.createdAt,
        source: {
          id: sources.id,
          name: sources.name,
          url: sources.url,
        },
      })
      .from(feeds)
      .leftJoin(sources, eq(feeds.sourceId, sources.id))
      .$dynamic();

    const conditions = [];
    
    if (sourceId) {
      conditions.push(eq(feeds.sourceId, sourceId));
    }
    
    if (cursor) {
      conditions.push(gte(feeds.publishedAt, new Date(cursor)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(feeds.publishedAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].publishedAt.toISOString()
      : null;

    return NextResponse.json({
      data: items,
      nextCursor,
      hasMore,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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
