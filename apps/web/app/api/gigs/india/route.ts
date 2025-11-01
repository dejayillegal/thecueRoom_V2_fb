import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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
import { deduplicateEvents, enrichWithAI, NormalizedEvent } from '@thecueroom/feeds/normalize';

export const dynamic = 'force-dynamic';

const CACHE_FILE = join(process.cwd(), '.local', 'feeds', 'india_gigs_cache.json');
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CacheData {
  timestamp: number;
  events: NormalizedEvent[];
}

async function fetchAllSources(): Promise<NormalizedEvent[]> {
  console.log('🇮🇳 Fetching India gigs from all sources...');

  const sources = [
    fetchRollingStoneIndia,
    fetchSortMyScene,
    fetchDiceIndia,
    fetchSkillboxIndia,
    fetchPaytmInsider,
    fetchBookMyShow,
    fetchZomatoLive,
    fetchSwiggyEvents,
  ];

  const results = await Promise.allSettled(sources.map(fn => fn()));

  const allEvents: NormalizedEvent[] = [];
  let successCount = 0;

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
      successCount++;
      console.log(`✅ Source ${idx + 1}: ${result.value.length} events`);
    } else {
      console.error(`❌ Source ${idx + 1} failed:`, result.reason);
    }
  });

  console.log(`📊 Total: ${allEvents.length} events from ${successCount}/${sources.length} sources`);

  // Deduplicate and enrich
  const deduplicated = deduplicateEvents(allEvents);
  const enriched = deduplicated.map(enrichWithAI);

  // Filter future events only
  const now = new Date();
  const futureEvents = enriched.filter(e => new Date(e.date) >= now);

  // Sort by date
  futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return futureEvents;
}

function loadCache(): CacheData | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const data = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveCache(events: NormalizedEvent[]): void {
  try {
    const dir = join(process.cwd(), '.local', 'feeds');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const cache: CacheData = {
      timestamp: Date.now(),
      events,
    };

    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function GET() {
  try {
    // Check cache
    const cache = loadCache();
    const now = Date.now();

    if (cache && (now - cache.timestamp) < CACHE_TTL) {
      console.log('📦 Serving from cache');
      return NextResponse.json({
        gigs: cache.events,
        total: cache.events.length,
        cached: true,
      });
    }

    // Fetch fresh data
    const events = await fetchAllSources();

    // Save to cache
    saveCache(events);

    return NextResponse.json({
      gigs: events,
      total: events.length,
      cached: false,
    });
  } catch (error) {
    console.error('India gigs error:', error);

    // Fallback to cache on error
    const cache = loadCache();
    if (cache) {
      return NextResponse.json({
        gigs: cache.events,
        total: cache.events.length,
        cached: true,
        error: 'Using cached data due to fetch error',
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch gigs', gigs: [] },
      { status: 500 }
    );
  }
}