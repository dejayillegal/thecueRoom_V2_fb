import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, feedsSources } from '@thecueroom/db/schema';
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
      gt(feeds.publishedAt, twoWeeksAgo)
    ];

    if (sourceId) {
      conditions.push(eq(feeds.sourceId, sourceId));
    }

    if (category) {
      // Corrected: feedsSources tags check if filtering by category
      // or check rawData/tags if present on feeds. 
      // Based on schema, feedsSources has tags. feeds has sourceId.
      const sourceSubquery = db.select({ id: feedsSources.id })
        .from(feedsSources)
        .where(sql`${feedsSources.tags} ? ${category}`);
      
      conditions.push(sql`${feeds.sourceId} IN (${sourceSubquery})`);
    }

    const results = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.url,
        image: feeds.thumbnailUrl,
        publishedAt: feeds.publishedAt,
        sourceId: feeds.sourceId,
        sourceName: feedsSources.name,
      })
      .from(feeds)
      .leftJoin(feedsSources, eq(feeds.sourceId, feedsSources.id))
      .where(and(...conditions))
      .orderBy(desc(feeds.publishedAt), desc(feeds.id))
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
        tags: [],
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
