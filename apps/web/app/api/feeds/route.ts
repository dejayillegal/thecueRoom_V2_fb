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

// packages/db/feedSources.ts (or existing equivalent)
const FEED_SOURCES = [
  // Scene / Underground
  { name:"6AM Group", kind:"rss", url:"https://www.6amgroup.com/feed/", tags:["scene","asia"] },
  { name:"The Playground", kind:"rss", url:"https://theplayground.co.uk/blog/feed/", tags:["scene"] },
  { name:"Earmilk", kind:"rss", url:"https://earmilk.com/feed/", tags:["scene"] },
  { name:"XLR8R", kind:"rss", url:"https://xlr8r.com/feed/", tags:["scene","mixes"] },
  { name:"FACT", kind:"rss", url:"https://www.factmag.com/feed/", tags:["news"] },
  { name:"Bandcamp Daily", kind:"rss", url:"https://daily.bandcamp.com/feed", tags:["features"] },
  { name:"Ransom Note", kind:"rss", url:"https://www.theransomnote.com/feed/", tags:["culture"] },
  { name:"Stereofox", kind:"rss", url:"https://www.stereofox.com/feed/", tags:["discover"] },
  { name:"Neon Music", kind:"rss", url:"https://neonmusic.co.uk/feed/", tags:["discover"] },
  { name:"This Song Is Sick", kind:"rss", url:"https://thissongissick.com/feed/", tags:["discover"] },
  { name:"Your EDM", kind:"rss", url:"https://www.youredm.com/feed/", tags:["edm"] },
  { name:"EDM.com", kind:"rss", url:"https://edm.com/.rss/full/", tags:["edm"] },

  // Industry
  { name:"Music Business Worldwide", kind:"rss", url:"https://www.musicbusinessworldwide.com/feed/", tags:["industry"] },
  { name:"Hypebot", kind:"rss", url:"https://www.hypebot.com/feed", tags:["industry"] },

  // Gear / Production
  { name:"CDM", kind:"rss", url:"https://cdm.link/feed/", tags:["production"] },
  { name:"MusicTech", kind:"rss", url:"https://musictech.com/feed/", tags:["gear"] },
  { name:"Bedroom Producers Blog", kind:"rss", url:"https://bedroomproducersblog.com/feed/", tags:["plugins"] },

  // Asia / India
  { name:"Rolling Stone India", kind:"rss", url:"https://rollingstoneindia.com/feed/", tags:["india"] },
  { name:"HighOnScore", kind:"rss", url:"https://highonscore.com/feed/", tags:["india"] },
];

const AUTHORITATIVE_SOURCES = FEED_SOURCES;

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Standardize protocol and hostname
    u.protocol = 'https:';
    u.hostname = u.hostname.replace(/^www\./, '');
    
    // Strip common tracking parameters
    const params = u.searchParams;
    const toDelete = Array.from(params.keys()).filter(k => 
      k.startsWith('utm_') || 
      ['ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid', 's'].includes(k.toLowerCase())
    );
    toDelete.forEach(k => params.delete(k));
    
    // Remove trailing slash and normalize case
    let path = u.pathname.replace(/\/$/, '');
    return (u.origin + path + u.search).toLowerCase().trim();
  } catch (e) {
    return url.toLowerCase().trim();
  }
}

function generateCanonicalKey(item: any): string {
  const normUrl = normalizeUrl(item.link || item.url || '');
  if (normUrl && normUrl !== 'http:' && normUrl !== 'https:') {
    return normUrl;
  }
  
  // Fallback: normalized title + date
  const normTitle = normalizeTitle(item.title || '');
  const dateStr = item.isoDate || (item.publishedAt instanceof Date ? item.publishedAt.toISOString() : '');
  const datePart = dateStr.split('T')[0] || 'no-date';
  return `fallback:${normTitle}:${datePart}`;
}

async function ingestFeeds(db: any) {
  const parser = new Parser({ 
    timeout: 8000,
    headers: { 'User-Agent': 'thecueRoom-V2-Ingest/1.1' }
  });
  
  // Process each source independently and concurrently
  const sourcePromises = AUTHORITATIVE_SOURCES.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      return (feed.items || []).map(item => ({ ...item, sourceName: source.name }));
    } catch (err) {
      console.error(`Source failure [${source.name}]:`, err.message);
      return [];
    }
  });

  const results = await Promise.allSettled(sourcePromises);
  const rawItems = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Phase 3: Advanced Deduplication
  const dedupedMap = new Map<string, any>();

  for (const item of rawItems) {
    const key = generateCanonicalKey(item);
    if (!key) continue;

    const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
    const thumbnailUrl = (item as any).enclosure?.url || 
                        (item as any)['media:content']?.['$']?.url || 
                        (item as any).content?.match(/<img[^>]+src="([^">]+)"/)?.[1] || '';
    
    const current = {
      key,
      title: item.title?.trim(),
      summary: (item.contentSnippet || item.content || '').trim(),
      url: (item as any).link || (item as any).url,
      thumbnail_url: thumbnailUrl,
      published_at: publishedAt,
      source: (item as any).sourceName,
      hasThumbnail: !!thumbnailUrl && thumbnailUrl.startsWith('http'),
      summaryLength: (item.contentSnippet || '').length
    };

    const existing = dedupedMap.get(key);
    if (!existing) {
      dedupedMap.set(key, current);
      continue;
    }

    // Rules: Prefer thumbnail > Richer summary > Newest
    let shouldReplace = false;
    if (!existing.hasThumbnail && current.hasThumbnail) {
      shouldReplace = true;
    } else if (existing.hasThumbnail === current.hasThumbnail) {
      if (current.summaryLength > existing.summaryLength + 50) {
        shouldReplace = true;
      } else if (Math.abs(current.summaryLength - existing.summaryLength) < 50) {
        if (current.published_at > existing.published_at) {
          shouldReplace = true;
        }
      }
    }

    if (shouldReplace) dedupedMap.set(key, current);
  }

  // Atomic persistence
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
            WHEN length(EXCLUDED.summary) > length(feeds.summary) + 20 THEN EXCLUDED.summary 
            ELSE feeds.summary 
          END;
      `);
    } catch (err) {
      // Ignore unique violations or minor insert errors to keep engine moving
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
    const state = (stateResult as any)[0] || { id: 1, lastIngestedAt: null };

    const feedsCountResult = await db.select({ count: sql`count(*)` }).from(feeds);
    const count = Number(feedsCountResult[0]?.count || 0);

    const shouldIngest = count === 0 || !state.lastIngestedAt || (now.getTime() - new Date(state.lastIngestedAt).getTime() > INGEST_THRESHOLD_MS);

    if (shouldIngest) {
      // NON-BLOCKING TRIGGER
      (async () => {
        try {
          const innerDb = getDbClient();
          await innerDb.execute(sql`
            INSERT INTO feed_state (id, last_ingested_at)
            VALUES (1, ${now})
            ON CONFLICT (id) DO UPDATE SET last_ingested_at = ${now};
          `);
          await ingestFeeds(innerDb);
        } catch (e) {
          console.error('Background ingestion failed:', e);
        }
      })();
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
      .orderBy(desc(feeds.publishedAt))
      .limit(limit)
      .offset(offset);

    const sanitizedItems = rows.map((item: any) => {
      if (!item.title || !item.url) return null;

      // Deterministic resolution order: item.thumbnail_url -> getDeterministicFallback
      let imageUrl = getDeterministicFallback(item.title);
      const thumb = item.thumbnail_url;
      if (thumb && typeof thumb === 'string' && thumb.trim() !== '' && thumb.trim() !== 'null') {
        const trimmedUrl = thumb.trim();
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
      items: sanitizedItems,
      total: count,
      hydrated: count > 0 && !!state.lastIngestedAt,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('Feed API fatal error:', error);
    return NextResponse.json({ 
      items: [], 
      total: 0, 
      hydrated: false, 
      error: 'Signal failure' 
    }, { status: 200 });
  }
}
