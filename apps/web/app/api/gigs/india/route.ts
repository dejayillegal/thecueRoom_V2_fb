import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources, SourceAdapter } from '@thecueroom/feeds/poller-gigs';
import { deduplicateEvents, enrichWithAI, filterEvents, NormalizedEvent } from '@thecueroom/feeds/normalize';
import {
  fetchRollingStoneIndia,
  fetchBookMyShow,
  fetchZomatoLive,
  fetchSwiggyEvents,
  fetchPaytmInsider,
  fetchSortMyScene,
  fetchSkillboxIndia,
  fetchDiceIndia,
} from '@thecueroom/feeds/sources';
import { readCache, writeCache } from '@thecueroom/feeds/cache';
import { getDbClient } from '@/lib/db-client';
import { gigs } from '@thecueroom/db/schema';
import { gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'india-gigs-aggregated';
const CACHE_TTL = parseInt(process.env.FEEDS_CACHE_TTL_SECONDS || '300', 10);

const gigSources: SourceAdapter[] = [
  { name: 'Rolling Stone India', enabled: true, fetch: fetchRollingStoneIndia },
  { name: 'BookMyShow', enabled: true, fetch: fetchBookMyShow },
  { name: 'Zomato Live', enabled: true, fetch: fetchZomatoLive },
  { name: 'Swiggy Events', enabled: true, fetch: fetchSwiggyEvents },
  { name: 'Paytm Insider', enabled: true, fetch: fetchPaytmInsider },
  { name: 'SortMyScene', enabled: true, fetch: fetchSortMyScene },
  { name: 'Skillbox India', enabled: true, fetch: fetchSkillboxIndia },
  { name: 'DICE India', enabled: true, fetch: fetchDiceIndia },
];

async function storeEventsInDB(events: NormalizedEvent[]) {
  try {
    const db = getDbClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const event of events) {
      try {
        await db.insert(gigs).values({
          title: event.title,
          description: event.description,
          venue: event.venue || 'TBA',
          location: event.city || 'India',
          city: event.city,
          startTime: event.startAt ? new Date(event.startAt) : now,
          endTime: event.endAt ? new Date(event.endAt) : undefined,
          ticketUrl: event.ticketUrl || event.url,
          genres: event.genreTags || [],
          source: event.source,
          imageUrl: event.imageUrl,
          approved: true,
          visibility: 'public',
          status: 'approved',
          userId: '00000000-0000-0000-0000-000000000000', // System user
        }).onConflictDoNothing();
      } catch (err) {
        // Ignore duplicate errors
      }
    }

    console.log(`[DB] Stored ${events.length} events`);
  } catch (error) {
    console.error('[DB] Failed to store events:', error);
  }
}

async function fetchAndProcessGigs(concurrency: number) {
  console.log('🇮🇳 Fetching India gigs from all sources...');
  const startTime = Date.now();

  const { events: allEvents, errors } = await fetchAllSources(gigSources, { 
    concurrency, 
    enabledOnly: true 
  });

  const totalDuration = Date.now() - startTime;
  console.log(`📊 Total: ${allEvents.length} events from sources (${errors.length} errors)`);

  // Apply Bollywood/pop filtering
  const filtered = filterEvents(allEvents);
  console.log(`🎵 After genre filtering: ${filtered.length} events (removed ${allEvents.length - filtered.length} non-electronic events)`);

  // Normalize and enrich
  const deduplicated = deduplicateEvents(filtered);
  const enriched = deduplicated.map(enrichWithAI);

  // Filter future events
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const futureEvents = enriched.filter((e: any) => {
    const eventDate = e.startAt ? new Date(e.startAt) : null;
    if (!eventDate || isNaN(eventDate.getTime())) {
      return true;
    }
    return eventDate >= sevenDaysAgo;
  });

  console.log(`📅 After date filtering: ${futureEvents.length} events`);

  // Sort by date
  futureEvents.sort((a, b) => {
    const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
    const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
    return dateA - dateB;
  });

  // Store in database
  await storeEventsInDB(futureEvents);

  return {
    events: futureEvents,
    errors,
    meta: gigSources.map(s => {
      const sourceEvents = allEvents.filter(e => e.source === s.name);
      const sourceErrors = errors.filter(e => e.source === s.name);
      return {
        name: s.name,
        items: sourceEvents.length,
        status: sourceErrors.length > 0 ? 'error' : 'ok',
        durationMs: totalDuration
      };
    })
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    // Check cache
    const cached = readCache(CACHE_KEY, CACHE_TTL);

    if (cached && !cached.isStale && !force && Array.isArray(cached.data.events) && cached.data.events.length > 0) {
      const cacheAge = Math.floor((Date.now() - (cached.data.timestamp || Date.now())) / 1000);
      return NextResponse.json({
        ok: true,
        fromCache: true,
        cacheAgeSeconds: cacheAge,
        meta: cached.data.meta || { totalSources: 0, sources: [] },
        events: cached.data.events || []
      });
    }

    // Fetch new data
    const concurrency = force ? 4 : parseInt(process.env.POLL_CONCURRENCY || '3', 10);
    const { events, errors, meta } = await fetchAndProcessGigs(concurrency);

    const payload = { events, errors, meta, timestamp: Date.now() };
    writeCache(CACHE_KEY, payload, CACHE_TTL);

    return NextResponse.json({
      ok: true,
      fromCache: false,
      cacheAgeSeconds: 0,
      meta: {
        totalSources: meta.length,
        sources: meta
      },
      events
    });

  } catch (error: any) {
    console.error('India gigs critical error:', error);

    const cached = readCache(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        ok: true,
        fromCache: true,
        cacheAgeSeconds: Math.floor((Date.now() - (cached.data.timestamp || Date.now())) / 1000),
        meta: {
          totalSources: cached.data.meta?.sources?.length || 0,
          sources: cached.data.meta?.sources || []
        },
        events: cached.data.events || []
      }, { status: 200 });
    }

    return NextResponse.json({
      ok: false,
      error: error.message,
      meta: { totalSources: 0, sources: [] },
      events: []
    }, { status: 500 });
  }
}