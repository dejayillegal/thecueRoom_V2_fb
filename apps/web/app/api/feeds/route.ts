import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, feedsSources, feedState } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;
const INGEST_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes
const FALLBACK_IMAGE = 'https://thecueroom.com/images/fallback-vector.png';

async function ingestFeeds(db: any) {
  const parser = new Parser({ timeout: 10000 });
  
  // Guarantee feeds_sources exists before querying
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feeds_sources (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        kind TEXT NOT NULL,
        tags jsonb NOT NULL DEFAULT '[]'::jsonb,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
  } catch (e) {
    console.error('Failed to ensure feeds_sources:', e);
  }

  const sources = await db.select().from(feedsSources).where(eq(feedsSources.enabled, true));
  
  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of (feed.items || []).slice(0, 20)) {
        if (!item.link || !item.title) continue;
        
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        
        await db.execute(sql`
          INSERT INTO feeds (source, title, summary, url, thumbnail_url, published_at)
          SELECT ${source.name}, ${item.title}, ${item.contentSnippet || ''}, ${item.link}, ${item.enclosure?.url || ''}, ${publishedAt}
          WHERE NOT EXISTS (SELECT 1 FROM feeds WHERE url = ${item.link});
        `);
      }
    } catch (err) {
      console.error(`Failed to ingest ${source.name}:`, err);
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limitParam = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
    
    const limit = isNaN(limitParam) ? ITEMS_PER_PAGE : Math.min(100, Math.max(1, limitParam));
    const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

    const db = getDbClient();
    if (!db) {
       return NextResponse.json({ error: 'Database connection failed', data: [], hasMore: false }, { status: 200 });
    }

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

    // PHASE 3 — INLINE INGESTION (API IS THE SCHEDULER)
    const now = new Date();
    const stateResult = await db.select().from(feedState).where(eq(feedState.id, 1)).limit(1);
    const state = stateResult[0] || { id: 1, lastIngestedAt: null };

    const feedsCountResult = await db.select({ count: sql`count(*)` }).from(feeds);
    const count = Number(feedsCountResult[0]?.count || 0);

    const shouldIngest = count === 0 || 
                         !state.lastIngestedAt || 
                         (now.getTime() - new Date(state.lastIngestedAt).getTime() > INGEST_THRESHOLD_MS);

    if (shouldIngest) {
      await db.update(feedState).set({ lastIngestedAt: now }).where(eq(feedState.id, 1));
      await ingestFeeds(db);
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conditions: any[] = [gt(feeds.publishedAt, twoWeeksAgo)];

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
        url: feeds.url,
        thumbnail_url: feeds.thumbnailUrl,
        published_at: feeds.publishedAt,
        source: feeds.source,
      })
      .from(feeds)
      .where(and(...conditions))
      .orderBy(desc(feeds.publishedAt), desc(feeds.id))
      .limit(limit)
      .offset(offset);

    const rows = Array.isArray(rawResults) ? rawResults : [];

    const sanitizedItems = rows.map(item => {
      if (!item) return null;
      
      // Strict thumbnail guarantee
      const imageUrl = (item.thumbnail_url && 
                        typeof item.thumbnail_url === 'string' && 
                        item.thumbnail_url.trim() !== '' && 
                        item.thumbnail_url.trim() !== 'null' &&
                        item.thumbnail_url.startsWith('http')) 
        ? item.thumbnail_url 
        : FALLBACK_IMAGE;

      return {
        id: item.id ?? '',
        title: item.title ?? 'Untitled Signal',
        summary: item.summary ?? '',
        url: item.url ?? '',
        image: imageUrl,
        publishedAt: item.published_at instanceof Date ? item.published_at.toISOString() : new Date().toISOString(),
        source: item.source ?? 'Unknown',
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
    return NextResponse.json({ error: 'Signal failure', data: [], hasMore: false }, { status: 200 });
  }
}
