import pLimit from 'p-limit';
import { NormalizedEvent, filterEvents, deduplicateEvents, enrichWithAI } from './normalize';
import { readCache, writeCache } from './cache';
import {
  fetchRollingStoneIndia,
  fetchSortMyScene,
  fetchDiceIndia,
  fetchSkillboxIndia,
  fetchPaytmInsider,
  fetchBookMyShow,
  fetchZomatoLive,
  fetchSwiggyEvents,
} from './sources';

export interface AggregatorResult {
  ok: boolean;
  summary: {
    total: number;
    bySource: Record<string, number>;
    errors: Record<string, string>;
    duration: number;
  };
  events: NormalizedEvent[];
}

export interface AggregatorOptions {
  concurrency?: number;
  timeout?: number;
  enabledSources?: string[];
  refresh?: boolean;
}

const CACHE_KEY = 'gigs-aggregated';
const CACHE_TTL = parseInt(process.env.FEEDS_CACHE_TTL_SECONDS || '300', 10); // 5 minutes

type FetchResult = NormalizedEvent[] | { events: NormalizedEvent[]; errors?: any[] };

/**
 * Source adapters registry
 */
const sourceAdapters: Record<string, () => Promise<FetchResult>> = {
  'rolling-stone-india': fetchRollingStoneIndia as () => Promise<FetchResult>,
  'sort-my-scene': fetchSortMyScene as () => Promise<FetchResult>,
  'dice-india': fetchDiceIndia as () => Promise<FetchResult>,
  'skillbox-india': fetchSkillboxIndia as () => Promise<FetchResult>,
  'paytm-insider': fetchPaytmInsider as () => Promise<FetchResult>,
  'bookmyshow': fetchBookMyShow as () => Promise<FetchResult>,
  'zomato-live': fetchZomatoLive as () => Promise<FetchResult>,
  'swiggy-events': fetchSwiggyEvents as () => Promise<FetchResult>,
};

/**
 * Aggregate events from all sources
 */
export async function aggregateEvents(
  options: AggregatorOptions = {}
): Promise<AggregatorResult> {
  const startTime = Date.now();
  const {
    concurrency = parseInt(process.env.POLL_CONCURRENCY || '3', 10),
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || '15000', 10),
    enabledSources,
    refresh = false,
  } = options;

  // Check cache first if not forcing refresh
  if (!refresh) {
    const cached = readCache(CACHE_KEY, CACHE_TTL);
    if (cached && cached.data) {
      console.log(`[Aggregator] Using cached results (${cached.data.events?.length || 0} events)`);
      return cached.data;
    }
  }

  const limit = pLimit(concurrency);
  const allEvents: NormalizedEvent[] = [];
  const bySource: Record<string, number> = {};
  const errors: Record<string, string> = {};

  // Determine which sources to fetch
  const sourcesToFetch = enabledSources
    ? Object.entries(sourceAdapters).filter(([key]) => enabledSources.includes(key))
    : Object.entries(sourceAdapters);

  console.log(`[Aggregator] Fetching from ${sourcesToFetch.length} sources...`);

  // Fetch from all sources in parallel with concurrency limit
  const results = await Promise.allSettled(
    sourcesToFetch.map(([sourceName, fetchFn]) =>
      limit(async () => {
        const sourceStart = Date.now();
        try {
          console.log(`[Aggregator] Fetching ${sourceName}...`);
          
          const result = await Promise.race([
            fetchFn(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), timeout)
            ),
          ]);

          // Handle both array and object return types
          const events = Array.isArray(result) ? result : result.events || [];
          
          const duration = Date.now() - sourceStart;
          bySource[sourceName] = events.length;
          console.log(`[Aggregator] ✓ ${sourceName}: ${events.length} events (${duration}ms)`);
          
          return { sourceName, events, error: null };
        } catch (error: any) {
          const duration = Date.now() - sourceStart;
          const errorMsg = error.message || String(error);
          errors[sourceName] = errorMsg;
          console.error(`[Aggregator] ✗ ${sourceName}: ${errorMsg} (${duration}ms)`);
          
          // Try to use cached data for this source
          const cached = readCache(`source-${sourceName}`, CACHE_TTL * 2);
          if (cached && cached.data) {
            console.log(`[Aggregator] 📦 Using cached ${sourceName} data`);
            return { sourceName, events: cached.data, error: errorMsg };
          }
          
          return { sourceName, events: [], error: errorMsg };
        }
      })
    )
  );

  // Collect all events
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.events) {
      allEvents.push(...result.value.events);
    }
  }

  console.log(`[Aggregator] Total events before filtering: ${allEvents.length}`);

  // Apply Bollywood filter and enrichment
  const filtered = filterEvents(allEvents);
  console.log(`[Aggregator] Events after Bollywood filter: ${filtered.length}`);

  const enriched = filtered.map(enrichWithAI);
  const deduplicated = deduplicateEvents(enriched);
  console.log(`[Aggregator] Events after deduplication: ${deduplicated.length}`);

  const duration = Date.now() - startTime;

  const aggregatorResult: AggregatorResult = {
    ok: true,
    summary: {
      total: deduplicated.length,
      bySource,
      errors,
      duration,
    },
    events: deduplicated,
  };

  // Cache the result
  writeCache(CACHE_KEY, aggregatorResult, CACHE_TTL);
  console.log(`[Aggregator] Complete: ${deduplicated.length} events in ${duration}ms`);

  return aggregatorResult;
}
