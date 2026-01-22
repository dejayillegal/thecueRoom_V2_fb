import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { feeds } from '@thecueroom/db/schema';
import { desc, sql, gt } from 'drizzle-orm';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_PER_PAGE = 24;
const INGEST_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes

const FEED_SOURCES = [
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
  { name:"Music Business Worldwide", kind:"rss", url:"https://www.musicbusinessworldwide.com/feed/", tags:["industry"] },
  { name:"Hypebot", kind:"rss", url:"https://www.hypebot.com/feed", tags:["industry"] },
  { name:"CDM", kind:"rss", url:"https://cdm.link/feed/", tags:["production"] },
  { name:"MusicTech", kind:"rss", url:"https://musictech.com/feed/", tags:["gear"] },
  { name:"Bedroom Producers Blog", kind:"rss", url:"https://bedroomproducersblog.com/feed/", tags:["plugins"] },
  { name:"Rolling Stone India", kind:"rss", url:"https://rollingstoneindia.com/feed/", tags:["india"] },
  { name:"HighOnScore", kind:"rss", url:"https://highonscore.com/feed/", tags:["india"] },
];

async function ingestFeeds(db: any) {
  const parser = new Parser({ timeout: 8000 });
  const promises = FEED_SOURCES.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items) {
        const thumb = item.enclosure?.url || (item as any)['media:content']?.['$']?.url || '';
        await db.insert(feeds).values({
          source: source.name,
          title: item.title || 'Untitled',
          summary: item.contentSnippet || item.content || '',
          url: item.link || '',
          thumbnailUrl: thumb,
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        }).onConflictDoNothing();
      }
    } catch (e) {
      console.error(`Ingest failed for ${source.name}:`, e);
    }
  });
  await Promise.allSettled(promises);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE));
    const db = getDbClient();

    // Check reality
    const [{ count }] = await db.select({ count: sql`count(*)` }).from(feeds);
    const lastFeed = await db.select({ date: feeds.createdAt }).from(feeds).orderBy(desc(feeds.createdAt)).limit(1);
    const isStale = !lastFeed[0] || (Date.now() - new Date(lastFeed[0].date!).getTime() > INGEST_THRESHOLD_MS);

    if (Number(count) === 0 || isStale) {
      // Idempotent non-blocking ingest
      (async () => {
        try { await ingestFeeds(db); } catch (e) {}
      })();
    }

    const rows = await db.select().from(feeds).orderBy(desc(feeds.publishedAt)).limit(limit).offset(offset);
    
    return NextResponse.json({
      items: rows.map(r => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        url: r.url,
        image: r.thumbnailUrl || `/api/fallback-thumb/${r.id}`,
        publishedAt: r.publishedAt?.toISOString(),
        source: r.source,
      })),
      total: Number(count),
      hydrated: true
    });
  } catch (e) {
    return NextResponse.json({ items: [], total: 0, hydrated: false }, { status: 500 });
  }
}
