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
    
    // PHASE 2 — SCHEMA GUARANTEE (IDEMPOTENT)
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS feeds (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          source TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT,
          url TEXT NOT NULL,
          thumbnail_url TEXT,
          published_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS feed_state (
          id INTEGER PRIMARY KEY,
          last_ingested_at TIMESTAMPTZ
        );
      `);

      await db.execute(sql`
        INSERT INTO feed_state (id, last_ingested_at)
        SELECT 1, NULL
        WHERE NOT EXISTS (SELECT 1 FROM feed_state WHERE id = 1);
      `);
    } catch (schemaError) {
      console.error('Schema guarantee failed:', schemaError);
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions: any[] = [
      gt(feeds.publishedAt, twoWeeksAgo)
    ];

    if (category) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM feeds_sources 
        WHERE feeds_sources.name = ${feeds.source} 
        AND feeds_sources.tags ? ${category}
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
        sourceName: feeds.source,
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
