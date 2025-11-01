
import { NextResponse } from 'next/server';
import pLimit from 'p-limit';
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
import { deduplicateEvents, enrichWithAI, NormalizedEvent } from '@thecueroom/feeds/normalize';

export const dynamic = 'force-dynamic';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'feeds.log');

interface FetchError {
  source: string;
  code: string;
  message: string;
  timestamp?: string;
}

interface FetchAllResult {
  events: NormalizedEvent[];
  errors: FetchError[];
}

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

async function fetchAllSources(): Promise<FetchAllResult> {
  console.log('🇮🇳 Fetching India gigs from all sources...');

  const limit = pLimit(3); // Concurrency limit
  const allErrors: FetchError[] = [];
  const allEvents: NormalizedEvent[] = [];

  const sources = [
    { name: 'Rolling Stone India', fn: fetchRollingStoneIndia },
    { name: 'SortMyScene', fn: fetchSortMyScene },
    { name: 'DICE India', fn: fetchDiceIndia },
    { name: 'Skillbox India', fn: fetchSkillboxIndia },
    { name: 'Paytm Insider', fn: fetchPaytmInsider },
    { name: 'BookMyShow', fn: fetchBookMyShow },
    { name: 'Zomato Live', fn: fetchZomatoLive },
    { name: 'Swiggy Events', fn: fetchSwiggyEvents },
  ];

  const results = await Promise.allSettled(
    sources.map(({ name, fn }) =>
      limit(async () => {
        try {
          const result = await fn();
          
          // Handle new return format with errors
          if (result && typeof result === 'object' && 'events' in result) {
            const { events, errors, fromCache } = result as any;
            
            if (errors && errors.length > 0) {
              errors.forEach((err: FetchError) => {
                const enrichedError = { ...err, timestamp: new Date().toISOString() };
                allErrors.push(enrichedError);
                logFetchError(enrichedError);
              });
            }
            
            console.log(`${fromCache ? '📦' : '✅'} ${name}: ${events.length} events${fromCache ? ' (cached)' : ''}`);
            return events;
          }
          
          // Legacy format - array of events
          console.log(`✅ ${name}: ${result.length} events`);
          return result;
        } catch (error: any) {
          const fetchError: FetchError = {
            source: name,
            code: error.code || 'UNKNOWN',
            message: error.message || 'Fetch failed',
            timestamp: new Date().toISOString(),
          };
          allErrors.push(fetchError);
          logFetchError(fetchError);
          console.error(`❌ ${name} failed:`, error.message);
          return [];
        }
      })
    )
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allEvents.push(...result.value);
    }
  });

  console.log(`📊 Total: ${allEvents.length} events from sources (${allErrors.length} errors)`);

  // Deduplicate and enrich
  const deduplicated = deduplicateEvents(allEvents);
  const enriched = deduplicated.map(enrichWithAI);

  // Filter future events only
  const now = new Date();
  const futureEvents = enriched.filter(e => new Date(e.date) >= now);

  // Sort by date
  futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    events: futureEvents,
    errors: allErrors,
  };
}

export async function GET() {
  try {
    const { events, errors } = await fetchAllSources();

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
