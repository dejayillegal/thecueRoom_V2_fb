import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, feedsSources, feedState } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';
import { IngestionService } from '@thecueroom/db/ingestion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;
const INGEST_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes
const FALLBACK_IMAGE = 'https://thecueroom.com/images/fallback-vector.png';

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
       return NextResponse.json({ 
         error: 'Database connection failed',
         data: [], 
         hasMore: false 
       }, { status: 200 });
    }

    // PHASE 2 & 3: Self-Triggered Ingestion with feed_state
    let stateResults = await db.select().from(feedState).where(eq(feedState.id, 1)).limit(1);
    
    if (stateResults.length === 0) {
      try {
        await db.insert(feedState).values({ id: 1, lastIngestedAt: null }).onConflictDoNothing();
        stateResults = await db.select().from(feedState).where(eq(feedState.id, 1)).limit(1);
      } catch (e) {
        stateResults = [{ id: 1, lastIngestedAt: null }];
      }
    }

    const lastIngested = stateResults[0]?.lastIngestedAt;
    const now = new Date();
    
    const feedCountResult = await db.select({ count: sql`count(*)` }).from(feeds);
    const feedCount = Number(feedCountResult[0]?.count || 0);

    const shouldIngest = feedCount === 0 || 
                         !lastIngested || 
                         (now.getTime() - new Date(lastIngested).getTime() > INGEST_THRESHOLD_MS);

    if (shouldIngest) {
      try {
        console.log('Self-triggered ingestion started (Awaiting completion)...');
        await IngestionService.run();
        console.log('Ingestion completed successfully.');
      } catch (ingestError) {
        console.error('Ingestion failed during request:', ingestError);
        // Fallback: If we have zero items, let the user know we're syncing
        if (feedCount === 0) {
          return NextResponse.json({
            error: 'Synchronizing network signal... please refresh in a moment.',
            data: [],
            hasMore: false
          }, { status: 200 });
        }
      }
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
      conditions.push(sql`${feeds.sourceId} IN (
        SELECT id FROM feeds_sources WHERE tags ? ${category}
      )`);
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

    // PHASE 5: Server-side Thumbnail Fallback Enforcement
    const sanitizedItems = safeResults.map(item => {
      if (!item) return null;
      
      const imageUrl = (item.image && item.image.trim() !== '' && item.image.trim() !== 'null') 
        ? item.image 
        : FALLBACK_IMAGE;

      return {
        id: item.id ?? '',
        title: item.title ?? 'Untitled Signal',
        summary: item.summary ?? '',
        url: item.link ?? '',
        image: imageUrl,
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
    console.error('Feed API fatal error:', error);
    return NextResponse.json(
      { error: 'Critical signal failure. Scanning for recovery.', data: [], hasMore: false },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
