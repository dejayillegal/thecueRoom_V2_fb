import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { feedsItems as feeds, feedsSources as sources } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';
import { IngestionService } from '@thecueroom/db/ingestion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;

export async function GET(request: Request) {
  try {
    // Trigger demand-driven ingestion (non-blocking)
    IngestionService.trigger();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getDbClient();
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions: any[] = [
      gt(feeds.publishedAt, twoWeeksAgo)
    ];

    if (sourceId) {
      conditions.push(eq(feeds.sourceId, sourceId));
    }

    if (category) {
      conditions.push(sql`${feeds.tags} @> ARRAY[${category}]::text[]`);
    }

    const results = await db
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
      .where(and(...conditions))
      .orderBy(desc(feeds.publishedAt), desc(feeds.id))
      .limit(limit)
      .offset(offset);

    const sanitizedItems = results.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.link || '',
      image: item.image,
      tags: item.tags || [],
      publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : item.publishedAt?.toISOString(),
      source: item.sourceName || 'Unknown',
    }));

    return NextResponse.json({
      data: sanitizedItems,
      hasMore: results.length === limit,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `no-store, max-age=0`,
      },
    });
  } catch (error: any) {
    console.error('Feed API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds', data: [] },
      { status: 500 }
    );
  }
}
