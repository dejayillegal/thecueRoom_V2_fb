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

    // PHASE 2 — SCHEMA GUARANTEE (IDEMPOTENT)
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS feeds (
          id uuid primary key default gen_random_uuid(),
          source_id uuid not null,
          source text not null,
          title text not null,
          summary text default '',
          url text not null,
          thumbnail_url text default '',
          published_at timestamptz default now(),
          created_at timestamptz default now(),
          content_hash text unique,
          raw_data jsonb default '{}'::jsonb
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS feed_state (
          id int primary key default 1,
          last_ingested_at timestamptz
        );
      `);

      await db.execute(sql`
        INSERT INTO feed_state (id, last_ingested_at)
        VALUES (1, NULL)
        ON CONFLICT (id) DO NOTHING;
      `);
    } catch (schemaError) {
      console.error('Schema guarantee failed:', schemaError);
    }

    // PHASE 3 — SAFE INGESTION LOGIC
    const now = new Date();
    let state;
    try {
      const stateResults = await db.select().from(feedState).where(eq(feedState.id, 1)).limit(1);
      state = stateResults[0] || { id: 1, lastIngestedAt: null };
    } catch (e) {
      state = { id: 1, lastIngestedAt: null };
    }

    const feedCountResult = await db.select({ count: sql`count(*)` }).from(feeds);
    const feedCount = Number(feedCountResult[0]?.count || 0);

    const shouldIngest = feedCount === 0 || 
                         !state.lastIngestedAt || 
                         (now.getTime() - new Date(state.lastIngestedAt).getTime() > INGEST_THRESHOLD_MS);

    if (shouldIngest) {
      try {
        console.log('Self-triggered ingestion started...');
        // Update timestamp FIRST to prevent concurrent triggers
        await db.update(feedState)
          .set({ lastIngestedAt: now })
          .where(eq(feedState.id, 1));
          
        await IngestionService.run();
        console.log('Ingestion completed successfully.');
      } catch (ingestError) {
        console.error('Ingestion failed during request:', ingestError);
        // We continue to serve what we have, or return a friendly error if truly empty
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

    const rawResults = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.url,
        image: feeds.thumbnailUrl,
        publishedAt: feeds.publishedAt,
        sourceId: feeds.sourceId,
        sourceName: feeds.source, // Uses the source name column from feeds table
      })
      .from(feeds)
      .where(and(...conditions))
      .orderBy(desc(feeds.publishedAt), desc(feeds.id))
      .limit(limit)
      .offset(offset);

    // 🛡 PHASE 4 — NULL-SAFE API OUTPUT (MANDATORY)
    const rows = Array.isArray(rawResults) ? rawResults : [];

    const sanitizedItems = rows.map(item => {
      if (!item) return null;
      
      const imageUrl = (item.image && typeof item.image === 'string' && item.image.trim() !== '' && item.image.trim() !== 'null') 
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
