import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feedsItems as feeds, feedsSources as sources } from '@thecueroom/db/schema';
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

    // Defensive check before database query
    if (!db) {
       return NextResponse.json({ data: [], hasMore: false }, { status: 200 });
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

    // Hard Safety: Ensure results is an array
    const safeResults = Array.isArray(results) ? results : [];

    const sanitizedItems = safeResults.map(item => {
      // Defensive property access
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
    // Fail Silently with valid structure as per requirement
    console.error('Feed API error (Safety Patch):', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds', data: [], hasMore: false },
      { 
        status: 200, // Return 200 to prevent breaking frontend logic that expects data
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
