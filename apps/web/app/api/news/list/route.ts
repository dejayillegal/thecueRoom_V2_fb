import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt, like, or, gte, lte } from 'drizzle-orm';
import { newsListQuerySchema } from '@thecueroom/shared/newsSchemas';
import { getArticleImageSync } from '@/src/lib/feed-image';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

const CACHE_TTL = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = newsListQuerySchema.parse(queryParams);
    
    const {
      search,
      tags,
      category,
      platform,
      sort,
      dateFrom,
      dateTo,
      verifiedOnly,
      limit,
      offset,
      cursor,
    } = validatedQuery;

    const db = getDbClient();
    
    const conditions: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(feeds.title, searchPattern),
          like(feeds.summary, searchPattern)
        )
      );
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        conditions.push(
          sql`${feeds.tags} && ARRAY[${sql.join(tagArray.map(t => sql`${t}`), sql`, `)}]::text[]`
        );
      }
    }

    if (category) {
      conditions.push(
        sql`${sources.tags} @> ARRAY[${category}]::text[]`
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      conditions.push(gte(feeds.publishedAt, fromDate));
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      conditions.push(lte(feeds.publishedAt, toDate));
    } else {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      conditions.push(gt(feeds.publishedAt, twoWeeksAgo));
    }

    if (platform && platform !== 'all') {
      conditions.push(
        sql`${sources.tags} @> ARRAY[${platform}]::text[]`
      );
    }

    if (verifiedOnly) {
      conditions.push(eq(sources.enabled, true));
    }

    if (cursor) {
      const [timestamp, id] = cursor.split('_');
      conditions.push(
        sql`(${feeds.publishedAt}, ${feeds.id}) < (${timestamp}, ${id})`
      );
    }

    const baseQuery = db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.link,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        sourceId: feeds.sourceId,
        sourceName: sources.name,
      })
      .from(feeds)
      .leftJoin(sources, eq(feeds.sourceId, sources.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // TODO: Implement true popularity sorting (views, engagement metrics)
    // For now, popular defaults to latest since we don't have popularity data
    const orderedQuery = sort === 'popular'
      ? baseQuery.orderBy(desc(feeds.publishedAt))
      : baseQuery.orderBy(desc(feeds.publishedAt), desc(feeds.id));

    const paginatedQuery = cursor
      ? orderedQuery.limit(limit + 1)
      : orderedQuery.limit(limit + 1).offset(offset);

    const results = await paginatedQuery;

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, -1) : results;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = `${lastItem.publishedAt.toISOString()}_${lastItem.id}`;
    }

    const formattedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || '',
      link: item.link,
      image: item.image ? getArticleImageSync({
        image: item.image,
        guid: item.id,
        url: item.link,
        title: item.title
      }) : null,
      tags: item.tags || [],
      publishedAt: item.publishedAt.toISOString(),
      sourceId: item.sourceId,
      sourceName: item.sourceName || '',
    }));

    const response = NextResponse.json({
      items: formattedItems,
      nextCursor,
      hasMore,
    });

    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL}, stale-while-revalidate`
    );

    return response;
  } catch (error) {
    console.error('News list API error:', error);
    
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: (error as any).issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
