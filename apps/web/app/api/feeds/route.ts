import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feedsItems, feedsSources, feedsState } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';
import { getArticleImageSync } from '@/src/lib/feed-image';
import { IngestionService } from '@thecueroom/db/ingestion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 25;

const CACHE_TTL = 30;
const ITEMS_PER_PAGE = 24;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const statusOnly = searchParams.get('statusOnly') === 'true';

    // ⚡ CRON REPLACEMENT: Trigger ingestion on every API access
    // fire-and-forget to avoid blocking user request
    if (process.env.NODE_ENV === 'production' || searchParams.get('trigger') === 'true') {
      IngestionService.trigger().catch(console.error);
    }

    if (statusOnly) {
      const status = await IngestionService.getGlobalStatus();
      return NextResponse.json(status);
    }

    const db = getDbClient();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions: any[] = [
      gt(feedsItems.publishedAt, twoWeeksAgo)
    ];

    if (sourceId) {
      conditions.push(eq(feedsItems.sourceId, sourceId));
    }

    if (category) {
      conditions.push(sql`${feedsSources.tags} @> ARRAY[${category}]::text[]`);
    }

    const results = await db
      .select({
        id: feedsItems.id,
        title: feedsItems.title,
        summary: feedsItems.summary,
        link: feedsItems.link,
        image: feedsItems.image,
        tags: feedsItems.tags,
        publishedAt: feedsItems.publishedAt,
        sourceId: feedsItems.sourceId,
        sourceName: feedsSources.name,
      })
      .from(feedsItems)
      .leftJoin(feedsSources, eq(feedsItems.sourceId, feedsSources.id))
      .where(and(...conditions))
      .orderBy(desc(feedsItems.publishedAt), desc(feedsItems.id))
      .limit(limit)
      .offset(offset);

    const status = await IngestionService.getGlobalStatus();

    const sanitizedItems = results.map(item => ({
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

    return NextResponse.json({
      data: sanitizedItems,
      status,
      hasMore: results.length === limit,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `no-store, max-age=0`,
      },
    });
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds', data: [], status: { isRunning: false, hasFailed: true } },
      { status: 500 }
    );
  }
}
