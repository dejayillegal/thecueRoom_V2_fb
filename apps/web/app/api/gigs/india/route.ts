
import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
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

const LOG_DIR = join(process.cwd(), 'logs/feeds');
const DIAGNOSTICS_FILE = join(LOG_DIR, 'diagnostics.jsonl');
const DATA_DIR = join(process.cwd(), 'data/gigs');
const LATEST_FILE = join(DATA_DIR, 'india-latest.json');
const CACHE_KEY = 'india-gigs-aggregated';
const CACHE_TTL = parseInt(process.env.FEEDS_CACHE_TTL_SECONDS || '600', 10);

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

function writeDiagnostic(entry: any) {
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
    appendFileSync(DIAGNOSTICS_FILE, JSON.stringify({ ...entry, timestamp: Date.now() }) + '\n');
  } catch (err) {
    console.error('Failed to write diagnostic:', err);
  }
}

let isRefreshing = false;

async function fetchAndProcessGigs(concurrency: number) {
  console.log('🇮🇳 Fetching India gigs from all sources...');
  const startTime = Date.now();

  const { events: allEvents, errors } = await fetchAllSources(gigSources, { 
    concurrency, 
    enabledOnly: true 
  });

  const totalDuration = Date.now() - startTime;

  // Log source diagnostics
  gigSources.forEach(source => {
    const sourceEvents = allEvents.filter(e => e.source === source.name);
    const sourceErrors = errors.filter(e => e.source === source.name);
    
    writeDiagnostic({
      source: source.name,
      method: sourceErrors[0]?.methodAttempted || 'unknown',
      statusCode: sourceErrors[0]?.code || 'success',
      itemCount: sourceEvents.length,
      durationMs: totalDuration,
      error: sourceErrors[0]?.message || null
    });
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

  // Normalize to canonical shape
  const normalizedEvents = futureEvents.map(e => ({
    id: e.id,
    title: e.title,
    start: e.startAt || new Date().toISOString(),
    end: e.endAt,
    venue: e.venue,
    city: e.city,
    url: e.url,
    ticketUrl: e.ticketUrl,
    source: e.source,
    imageUrl: e.imageUrl,
    raw: e
  }));

  return {
    events: normalizedEvents,
    errors,
    meta: gigSources.map(s => {
      const sourceEvents = allEvents.filter(e => e.source === s.name);
      const sourceErrors = errors.filter(e => e.source === s.name);
      return {
        name: s.name,
        items: sourceEvents.length,
        method: sourceErrors[0]?.methodAttempted || 'success',
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

    // Fast path: serve from disk cache if exists (temporary workaround)
    if (!force && existsSync(LATEST_FILE)) {
      try {
        const diskData = JSON.parse(readFileSync(LATEST_FILE, 'utf-8'));
        const cacheAge = Math.floor((Date.now() - diskData.timestamp) / 1000);
        
        if (cacheAge < CACHE_TTL) {
          return NextResponse.json({
            ok: true,
            fromCache: true,
            cacheAgeSeconds: cacheAge,
            meta: diskData.meta || { totalSources: 0, sources: [] },
            events: diskData.events || []
          });
        }
      } catch (err) {
        console.error('Failed to read disk cache:', err);
      }
    }

    // Check memory cache
    const cached = readCache(CACHE_KEY, CACHE_TTL);
    
    // Return cached immediately if fresh or not forcing
    if (cached && !force) {
      const cacheAge = Math.floor((Date.now() - (cached.data.timestamp || Date.now())) / 1000);

      // If cache is stale, trigger background refresh
      if (cached.isStale && !isRefreshing) {
        isRefreshing = true;
        fetchAndProcessGigs(3)
          .then(({ events, errors, meta }) => {
            const payload = { events, errors, meta, timestamp: Date.now() };
            writeCache(CACHE_KEY, payload, CACHE_TTL);
            
            // Write to disk atomically
            if (!existsSync(DATA_DIR)) {
              mkdirSync(DATA_DIR, { recursive: true });
            }
            const tmpFile = join(DATA_DIR, 'india-latest.tmp.json');
            writeFileSync(tmpFile, JSON.stringify(payload, null, 2));
            writeFileSync(LATEST_FILE, JSON.stringify(payload, null, 2));
          })
          .catch(err => {
            console.error('[Background Refresh] Failed:', err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      return NextResponse.json({
        ok: true,
        fromCache: true,
        cacheAgeSeconds: cacheAge,
        meta: {
          totalSources: cached.data.meta?.sources?.length || 0,
          sources: cached.data.meta?.sources || []
        },
        events: cached.data.events || []
      });
    }

    // Force refresh or no cache - fetch new data synchronously
    const concurrency = force ? 4 : parseInt(process.env.POLL_CONCURRENCY || '3', 10);
    const { events, errors, meta } = await fetchAndProcessGigs(concurrency);

    const payload = { events, errors, meta, timestamp: Date.now() };

    // Write to cache
    writeCache(CACHE_KEY, payload, CACHE_TTL);
    
    // Write to disk atomically
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = join(DATA_DIR, 'india-latest.tmp.json');
    writeFileSync(tmpFile, JSON.stringify(payload, null, 2));
    writeFileSync(LATEST_FILE, JSON.stringify(payload, null, 2));

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
    
    // Try cache fallback on critical error
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
      fromCache: false,
      cacheAgeSeconds: null,
      error: {
        code: 'CRITICAL_ERROR',
        message: error.message
      },
      meta: { totalSources: 0, sources: [] },
      events: []
    }, { status: 200 });
  }
}
