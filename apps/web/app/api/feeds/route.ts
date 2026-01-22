import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, feedState } from '@thecueroom/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;
const INGEST_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes
const FALLBACK_IMAGE = 'https://thecueroom.com/images/fallback-vector.png';

const AUTHORITATIVE_SOURCES = [
  { name: 'Resident Advisor', url: 'https://ra.co/xml/rss/news.xml' },
  { name: 'Pitchfork', url: 'https://pitchfork.com/rss/news/' },
  { name: 'FACT Magazine', url: 'https://www.factmag.com/feed/' }
];

async function ingestFeeds(db: any) {
  const parser = new Parser({ 
    timeout: 10000,
    headers: {
      'User-Agent': 'thecueRoom-V2-Ingest/1.0'
    }
  });
  
  for (const source of AUTHORITATIVE_SOURCES) {
    try {
      console.log(`Scanning source: ${source.name}`);
      const feed = await parser.parseURL(source.url);
      const items = Array.isArray(feed.items) ? feed.items : [];
      
      for (const item of items.slice(0, 20)) {
        if (!item.link || !item.title) continue;
        
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        
        // Deterministic thumbnail extraction
        let thumbnailUrl = '';
        if (item.enclosure?.url) {
          thumbnailUrl = item.enclosure.url;
        } else if (item.content) {
          const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) thumbnailUrl = imgMatch[1];
        } else if (item['media:content']?.['$']?.url) {
          thumbnailUrl = item['media:content']['$'].url;
        }

        await db.execute(sql`
          INSERT INTO feeds (source, title, summary, url, thumbnail_url, published_at)
          VALUES (${source.name}, ${item.title}, ${item.contentSnippet || ''}, ${item.link}, ${thumbnailUrl}, ${publishedAt})
          ON CONFLICT (url) DO NOTHING;
        `);
      }
    } catch (err) {
      console.error(`Failed to ingest ${source.name}:`, err);
      // Continue to next source even if one fails
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
    
    const limit = isNaN(limitParam) ? ITEMS_PER_PAGE : Math.min(100, Math.max(1, limitParam));
    const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

    const db = getDbClient();
    if (!db) {
       return NextResponse.json({ error: 'Database connection failed', data: [], hasMore: false }, { status: 200 });
    }

    // Ensure schema and triggers
    const now = new Date();
    const stateResult = await db.select().from(feedState).where(eq(feedState.id, 1)).limit(1);
    const state = stateResult[0] || { id: 1, lastIngestedAt: null };

    const feedsCountResult = await db.select({ count: sql`count(*)` }).from(feeds);
    const count = Number(feedsCountResult[0]?.count || 0);

    const shouldIngest = count === 0 || 
                         !state.lastIngestedAt || 
                         (now.getTime() - new Date(state.lastIngestedAt).getTime() > INGEST_THRESHOLD_MS);

    if (shouldIngest) {
      // Immediate lock to prevent race conditions
      await db.execute(sql`
        INSERT INTO feed_state (id, last_ingested_at)
        VALUES (1, ${now})
        ON CONFLICT (id) DO UPDATE SET last_ingested_at = ${now};
      `);
      await ingestFeeds(db);
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const rows = await db
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
      .where(gt(feeds.publishedAt, twoWeeksAgo))
      .orderBy(desc(feeds.publishedAt), desc(feeds.id))
      .limit(limit)
      .offset(offset);

    const sanitizedItems = rows.map((item: any) => {
      const imageUrl = (item.thumbnail_url && 
                        typeof item.thumbnail_url === 'string' && 
                        item.thumbnail_url.trim() !== '' && 
                        item.thumbnail_url.trim() !== 'null' &&
                        item.thumbnail_url.startsWith('http')) 
        ? item.thumbnail_url 
        : FALLBACK_IMAGE;

      return {
        id: item.id,
        title: item.title,
        summary: item.summary || '',
        url: item.url,
        image: imageUrl,
        publishedAt: item.published_at instanceof Date ? item.published_at.toISOString() : new Date().toISOString(),
        source: item.source,
      };
    });

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
