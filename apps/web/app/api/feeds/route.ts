import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds, feedState } from '@thecueroom/db/schema';
import { desc, eq, sql, gt } from 'drizzle-orm';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;
const INGEST_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes
const FALLBACK_IMAGES = [
  '/fallbacks/fallback_1.png',
  '/fallbacks/fallback_2.png',
  '/fallbacks/fallback_3.png',
  '/fallbacks/fallback_4.png'
];

function getDeterministicFallback(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

const AUTHORITATIVE_SOURCES = [
  { name: 'Resident Advisor', url: 'https://ra.co/xml/rss/news.xml' },
  { name: 'Pitchfork', url: 'https://pitchfork.com/rss/news/' },
  { name: 'FACT Magazine', url: 'https://www.factmag.com/feed/' },
  { name: 'Mixmag', url: 'https://mixmag.net/rss/news' },
  { name: 'DJ Mag', url: 'https://djmag.com/news/feed' },
  { name: 'MusicRadar', url: 'https://www.musicradar.com/rss/news' },
  { name: 'XLR8R', url: 'https://xlr8r.com/feed/' },
  { name: 'Stereogum', url: 'https://www.stereogum.com/feed/' }
];

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const params = u.searchParams;
    const toDelete = Array.from(params.keys()).filter(k => 
      k.startsWith('utm_') || k === 'ref' || k === 'source' || k === 'fbclid'
    );
    toDelete.forEach(k => params.delete(k));
    return (u.origin + u.pathname + u.search).toLowerCase().trim();
  } catch (e) {
    return url.toLowerCase().trim();
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

async function ingestFeeds(db: any) {
  const parser = new Parser({ 
    timeout: 10000,
    headers: { 'User-Agent': 'thecueRoom-V2-Ingest/1.0' }
  });
  
  const allItems: any[] = [];

  for (const source of AUTHORITATIVE_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      const sourceItems = Array.isArray(feed.items) ? feed.items : [];
      
      for (const item of sourceItems.slice(0, 30)) {
        if (!item.link || !item.title) continue;
        
        const normUrl = normalizeUrl(item.link);
        const normTitle = normalizeTitle(item.title);
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();

        let thumbnailUrl = '';
        if (item.enclosure?.url) {
          thumbnailUrl = item.enclosure.url;
        } else if (item.content) {
          const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) thumbnailUrl = imgMatch[1];
        } else if (item['media:content']?.['$']?.url) {
          thumbnailUrl = item['media:content']['$'].url;
        }

        allItems.push({
          canonicalKey: normUrl,
          normTitle,
          title: item.title,
          summary: item.contentSnippet || '',
          url: normUrl,
          thumbnail_url: thumbnailUrl,
          published_at: publishedAt,
          source: source.name,
          hasImage: !!thumbnailUrl && (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://'))
        });
      }
    } catch (err) {
      console.error(`Failed to ingest ${source.name}:`, err);
    }
  }

  const dedupedMap = new Map<string, any>();
  for (const item of allItems) {
    const existing = dedupedMap.get(item.canonicalKey);
    if (!existing) {
      dedupedMap.set(item.canonicalKey, item);
      continue;
    }

    let replace = false;
    if (!existing.hasImage && item.hasImage) {
      replace = true;
    } else if (existing.hasImage === item.hasImage) {
      if (item.published_at.getTime() < existing.published_at.getTime()) {
        replace = true;
      }
    }

    if (replace) dedupedMap.set(item.canonicalKey, item);
  }

  for (const item of dedupedMap.values()) {
    try {
      await db.execute(sql`
        INSERT INTO feeds (source, title, summary, url, thumbnail_url, published_at)
        VALUES (${item.source}, ${item.title}, ${item.summary}, ${item.url}, ${item.thumbnail_url}, ${item.published_at})
        ON CONFLICT (url) DO UPDATE SET
          thumbnail_url = CASE 
            WHEN feeds.thumbnail_url IS NULL OR feeds.thumbnail_url = '' THEN EXCLUDED.thumbnail_url 
            ELSE feeds.thumbnail_url 
          END,
          summary = CASE 
            WHEN feeds.summary IS NULL OR feeds.summary = '' THEN EXCLUDED.summary 
            ELSE feeds.summary 
          END;
      `);
    } catch (err) {
      console.error('Insert error:', err);
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const db = getDbClient();
    if (!db) return NextResponse.json({ error: 'Database connection failed', data: [], hasMore: false }, { status: 200 });

    const now = new Date();
    const stateResult = await db.select().from(feedState).where(eq(feedState.id, 1)).limit(1);
    const state = stateResult[0] || { id: 1, lastIngestedAt: null };

    const feedsCountResult = await db.select({ count: sql`count(*)` }).from(feeds);
    const count = Number(feedsCountResult[0]?.count || 0);

    const shouldIngest = count === 0 || !state.lastIngestedAt || (now.getTime() - new Date(state.lastIngestedAt).getTime() > INGEST_THRESHOLD_MS);

    if (shouldIngest) {
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
      if (!item.title || !item.url) return null;

      let imageUrl = getDeterministicFallback(item.title);
      if (item.thumbnail_url && typeof item.thumbnail_url === 'string' && item.thumbnail_url.trim() !== '' && item.thumbnail_url.trim() !== 'null') {
        const trimmedUrl = item.thumbnail_url.trim();
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
          imageUrl = trimmedUrl;
        }
      }

      const sourceName = item.source || 'Unknown Source';
      const sourceSlug = sourceName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

      return {
        id: item.id,
        title: item.title,
        summary: item.summary || '',
        url: item.url,
        image: imageUrl,
        publishedAt: item.published_at instanceof Date ? item.published_at.toISOString() : new Date().toISOString(),
        source: sourceName,
        sourceSlug: sourceSlug
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
