
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
import { fetchAllSources, SourceAdapter } from '@thecueroom/feeds/poller-gigs';
import { deduplicateEvents, enrichWithAI, NormalizedEvent } from '@thecueroom/feeds/normalize';

export const dynamic = 'force-dynamic';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'feeds.log');

const gigSources: SourceAdapter[] = [
  { name: 'Rolling Stone India', enabled: true, fetch: fetchRollingStoneIndia },
  { name: 'SortMyScene', enabled: true, fetch: fetchSortMyScene },
  { name: 'DICE India', enabled: true, fetch: fetchDiceIndia },
  { name: 'Skillbox India', enabled: true, fetch: fetchSkillboxIndia },
  { name: 'Paytm Insider', enabled: true, fetch: fetchPaytmInsider },
  { name: 'BookMyShow', enabled: true, fetch: fetchBookMyShow },
  { name: 'Zomato Live', enabled: true, fetch: fetchZomatoLive },
  { name: 'Swiggy Events', enabled: true, fetch: fetchSwiggyEvents },
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
    const enrichedError = { ...err, timestamp: new Date().toISOString() };
    logFetchError(enrichedError);
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
    errors,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get('refresh') === 'true';
    const concurrency = refresh ? 4 : 3;

    const { events, errors } = await fetchAndProcessGigs(concurrency);

    // Always return valid JSON with both events and errors
    return NextResponse.json(
      {
        ok: true,
        events,
        errors,
        total: events.length,
        errorCount: errors.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('India gigs critical error:', error);

    // Even on catastrophic failure, return valid JSON
    return NextResponse.json(
      {
        ok: true,
        events: [],
        errors: [{
          source: 'system',
          code: 'CRITICAL_ERROR',
          message: error.message || 'Unknown system error',
          timestamp: new Date().toISOString(),
        }],
        total: 0,
        errorCount: 1,
      },
      { status: 200 }
    );
  }
}
