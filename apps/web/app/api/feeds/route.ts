import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds } from '@thecueroom/db/schema';
import { desc, sql, gt } from 'drizzle-orm';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;
const INGEST_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes

// Sources defined in code - NO DB TABLE.
const FEED_SOURCES = [
  { name: "6AM Group", url: "https://www.6amgroup.com/feed/" },
  { name: "The Playground", url: "https://theplayground.co.uk/blog/feed/" },
  { name: "Earmilk", url: "https://earmilk.com/feed/" },
  { name: "XLR8R", url: "https://xlr8r.com/feed/" },
  { name: "FACT", url: "https://www.factmag.com/feed/" },
  { name: "Bandcamp Daily", url: "https://daily.bandcamp.com/feed" },
  { name: "Ransom Note", url: "https://www.theransomnote.com/feed/" },
  { name: "Stereofox", url: "https://www.stereofox.com/feed/" },
  { name: "Neon Music", url: "https://neonmusic.co.uk/feed/" },
  { name: "This Song Is Sick", url: "https://thissongissick.com/feed/" },
  { name: "Your EDM", url: "https://www.youredm.com/feed/" },
  { name: "EDM.com", url: "https://edm.com/.rss/full/" },
  { name: "Music Business Worldwide", url: "https://www.musicbusinessworldwide.com/feed/" },
  { name: "Hypebot", url: "https://www.hypebot.com/feed" },
  { name: "CDM", url: "https://cdm.link/feed/" },
  { name: "MusicTech", url: "https://musictech.com/feed/" },
  { name: "Bedroom Producers Blog", url: "https://bedroomproducersblog.com/feed/" },
  { name: "Rolling Stone India", url: "https://rollingstoneindia.com/feed/" },
  { name: "HighOnScore", url: "https://highonscore.com/feed/" },
];

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
    hash |= 0;
  }
  return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length];
}

async function bootstrapDb(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS feeds (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      summary TEXT,
      published_at TIMESTAMP,
      source TEXT NOT NULL,
      tags TEXT[],
      thumbnail TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function ingestFeeds(db: any) {
  const parser = new Parser({ timeout: 10000 });
  const promises = FEED_SOURCES.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of (feed.items || [])) {
        const thumb = item.enclosure?.url || 
                     (item as any)['media:content']?.['$']?.url || 
                     item.content?.match(/<img[^>]+src="([^">]+)"/)?.[1] || '';
        
        await db.insert(feeds).values({
          source: source.name,
          title: item.title || 'Untitled',
          summary: item.contentSnippet || item.content || '',
          url: item.link || '',
          thumbnail: thumb || getDeterministicFallback(item.title || ''),
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        }).onConflictDoNothing();
      }
    } catch (e) {
      console.error(`Ingest failed for ${source.name}:`, (e as any).message);
    }
  });
  await Promise.allSettled(promises);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10);
    const db = getDbClient();

    // Bootstrap first - ensures table exists without throwing
    try {
      await bootstrapDb(db);
    } catch (bootstrapErr) {
      console.error('Bootstrap failed, but continuing:', (bootstrapErr as any).message);
    }

    // Check reality - derive state from feeds table
    let count = 0;
    try {
      const feedsCountResult = await db.select({ count: sql<number>`count(*)` }).from(feeds);
      count = Number(feedsCountResult[0]?.count || 0);
    } catch (countErr) {
      console.error('Count query failed, table might be transitioning:', (countErr as any).message);
    }
    
    let lastFeedDate: Date | null = null;
    try {
      const lastFeed = await db.select({ date: feeds.publishedAt })
        .from(feeds)
        .orderBy(desc(feeds.publishedAt))
        .limit(1);
      lastFeedDate = lastFeed[0]?.date ? new Date(lastFeed[0].date) : null;
    } catch (lastFeedErr) {
      console.error('Last feed query failed:', (lastFeedErr as any).message);
    }

    const isStale = count > 0 && lastFeedDate && (Date.now() - lastFeedDate.getTime() > INGEST_THRESHOLD_MS);

    // If empty -> Ingest immediately and BLOCK until first batch is in
    if (count === 0) {
      await ingestFeeds(db);
      // Refresh count and get rows after mandatory ingestion
      const newCountResult = await db.select({ count: sql<number>`count(*)` }).from(feeds);
      const newCount = Number(newCountResult[0]?.count || 0);
      
      const rows = await db.select().from(feeds)
        .orderBy(desc(feeds.publishedAt))
        .limit(limit)
        .offset(offset);

      return NextResponse.json({
        items: rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          summary: r.summary || '',
          url: r.url,
          image: r.thumbnail && r.thumbnail.startsWith('http') ? r.thumbnail : getDeterministicFallback(r.title),
          publishedAt: (r.publishedAt instanceof Date ? r.publishedAt : new Date(r.publishedAt)).toISOString(),
          source: r.source || 'Unknown',
        })),
        total: newCount,
        hydrated: newCount > 0
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    } else if (isStale) {
      // Ingest asynchronously for stale data - don't block
      (async () => {
        try {
          const innerDb = getDbClient();
          await ingestFeeds(innerDb);
        } catch (e) {
          console.error('Background ingestion error:', (e as any).message);
        }
      })();
    }

    // Standard path for existing data
    const rows = await db.select().from(feeds)
      .orderBy(desc(feeds.publishedAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json({
      items: rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        summary: r.summary || '',
        url: r.url,
        image: r.thumbnail && r.thumbnail.startsWith('http') ? r.thumbnail : getDeterministicFallback(r.title),
        publishedAt: (r.publishedAt instanceof Date ? r.publishedAt : new Date(r.publishedAt)).toISOString(),
        source: r.source || 'Unknown',
      })),
      total: count,
      hydrated: count > 0
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (e) {
    console.error('Feed API error:', (e as any).message);
    return NextResponse.json({ items: [], total: 0, hydrated: false }, { status: 200 });
  }
}
