import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { feeds, feedState as globalFeedState, feedsSources as sources } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';
import { IngestionService } from '@thecueroom/db/ingestion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;

export async function GET(request: Request) {
  try {
    const db = getDbClient();
    
    // Phase 3 & 4: Self-Triggered Ingestion Engine
    const [existingCount] = await db.select({ count: sql<number>`count(*)` }).from(feeds);
    const [status] = await db.select().from(globalFeedState).where(eq(globalFeedState.id, 1)).limit(1);
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const isStale = !status?.lastIngestedAt || status.lastIngestedAt < oneHourAgo;
    const isEmpty = Number(existingCount?.count || 0) === 0;

    if (isEmpty) {
      console.log('[API] First run detected, awaiting ingestion...');
      await IngestionService.run();
    } else if (isStale) {
      console.log('[API] Data stale, triggering background ingestion...');
      IngestionService.trigger();
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions: any[] = [
      gt(feeds.publishedAt, twoWeeksAgo)
    ];

    if (sourceId) {
      conditions.push(eq(feeds.sourceId, sourceId));
    }

    if (category) {
      conditions.push(sql`${feeds.tags} @> ARRAY[${category}]::jsonb`);
    }

    const results = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.url,
        image: feeds.thumbnailUrl,
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

    const sanitizedItems = results.map((item: any) => ({
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
