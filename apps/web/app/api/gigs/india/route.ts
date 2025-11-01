
import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  fetchRollingStoneIndia,
  fetchSortMyScene,
  fetchDiceIndia,
  fetchSkillboxIndia,
  fetchPaytmInsider,
  fetchBookMyShow,
  fetchZomatoLive,
  fetchSwiggyEvents,
} from '@thecueroom/feeds/sources';
import { fetchAllSources, SourceAdapter, FetchError } from '@thecueroom/feeds/poller-gigs';
import { deduplicateEvents, enrichWithAI, NormalizedEvent } from '@thecueroom/feeds/normalize';
import { readCache, writeCache } from '@thecueroom/feeds/cache';

export const dynamic = 'force-dynamic';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'feeds.log');
const CACHE_KEY = 'india-gigs-aggregated';
const CACHE_TTL = 900; // 15 minutes

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

function logFetchError(error: FetchError) {
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
    
    const logEntry = `[${new Date().toISOString()}] ${error.source} - ${error.code}: ${error.message}\n`;
    writeFileSync(LOG_FILE, logEntry, { flag: 'a' });
  } catch (err) {
    console.error('Failed to write to feeds.log:', err);
  }
}

async function fetchAndProcessGigs(concurrency: number) {
  console.log('🇮🇳 Fetching India gigs from all sources...');

  const { events: allEvents, errors } = await fetchAllSources(gigSources, { 
    concurrency, 
    enabledOnly: true 
  });

  // Log errors
  errors.forEach(err => {
    logFetchError(err);
  });

  console.log(`📊 Total: ${allEvents.length} events from sources (${errors.length} errors)`);

  // Deduplicate and enrich
  const deduplicated = deduplicateEvents(allEvents);
  const enriched = deduplicated.map(enrichWithAI);

  // Filter future events only
  const now = new Date();
  const futureEvents = enriched.filter(e => {
    const eventDate = e.startAt ? new Date(e.startAt) : null;
    return eventDate && eventDate >= now;
  });

  // Sort by startAt
  futureEvents.sort((a, b) => {
    const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
    const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
    return dateA - dateB;
  });

  return {
    events: futureEvents,
    errors
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';
    const city = searchParams.get('city');
    const source = searchParams.get('source');

    // Check cache first for instant response
    const cached = readCache<{ events: NormalizedEvent[]; errors: FetchError[] }>(CACHE_KEY, CACHE_TTL);
    
    if (cached && !cached.isStale && !force) {
      // Return cached immediately
      let filteredEvents = cached.data.events;
      
      if (city) {
        filteredEvents = filteredEvents.filter(e => 
          e.city?.toLowerCase().includes(city.toLowerCase())
        );
      }
      
      if (source) {
        filteredEvents = filteredEvents.filter(e => e.source === source);
      }

      return NextResponse.json({
        ok: true,
        events: filteredEvents,
        errors: cached.data.errors || [],
        total: filteredEvents.length,
        errorCount: cached.data.errors?.length || 0,
        meta: {
          fromCache: true,
          sources: [...new Set(filteredEvents.map(e => e.source))],
        }
      });
    }

    // Cache stale or force refresh - fetch new data
    const concurrency = force ? 4 : 3;
    const { events, errors } = await fetchAndProcessGigs(concurrency);

    // Write to cache
    writeCache(CACHE_KEY, { events, errors }, CACHE_TTL);

    // Apply filters
    let filteredEvents = events;
    
    if (city) {
      filteredEvents = filteredEvents.filter(e => 
        e.city?.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    if (source) {
      filteredEvents = filteredEvents.filter(e => e.source === source);
    }

    return NextResponse.json({
      ok: true,
      events: filteredEvents,
      errors,
      total: filteredEvents.length,
      errorCount: errors.length,
      meta: {
        fromCache: false,
        sources: [...new Set(filteredEvents.map(e => e.source))],
      }
    });
    
  } catch (error: any) {
    console.error('India gigs critical error:', error);
    
    // Try cache fallback on critical error
    const cached = readCache<{ events: NormalizedEvent[]; errors: FetchError[] }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        ok: true,
        events: cached.data.events || [],
        errors: cached.data.errors || [],
        total: cached.data.events?.length || 0,
        errorCount: cached.data.errors?.length || 0,
        meta: {
          fromCache: true,
          criticalError: error.message
        }
      });
    }

    return NextResponse.json({
      ok: false,
      events: [],
      errors: [{
        source: 'System',
        code: 'CRITICAL_ERROR',
        message: error.message,
        fromCache: false
      }],
      total: 0,
      errorCount: 1
    }, { status: 500 });
  }
}
