import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feedsItems, feedsSources } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sourceId = searchParams.get('source');
    const limitParam = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
    
    const limit = isNaN(limitParam) ? ITEMS_PER_PAGE : Math.min(100, Math.max(1, limitParam));
    const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

    const db = getDbClient();
    if (!db) {
       return NextResponse.json({ data: [], hasMore: false }, { status: 200 });
    }
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions: any[] = [
      gt(feedsItems.publishedAt, twoWeeksAgo)
    ];

    if (sourceId) {
      conditions.push(eq(feedsItems.sourceId, sourceId));
    }

    if (category) {
      conditions.push(sql`${feedsItems.tags} @> ARRAY[${category}]::text[]`);
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

    const safeResults = Array.isArray(results) ? results : [];

    const sanitizedItems = safeResults.map(item => {
      if (!item) return null;
      
      return {
        id: item.id ?? '',
        title: item.title ?? 'Untitled Signal',
        summary: item.summary ?? '',
        url: item.link ?? '',
        image: item.image ?? '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        publishedAt: item.publishedAt instanceof Date 
          ? item.publishedAt.toISOString() 
          : (typeof item.publishedAt === 'string' ? item.publishedAt : new Date().toISOString()),
        source: item.sourceName ?? 'Unknown',
      };
    }).filter(Boolean);

    return NextResponse.json({
      data: sanitizedItems,
      hasMore: sanitizedItems.length === limit,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Feed API error (Safety Patch):', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds', data: [], hasMore: false },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
