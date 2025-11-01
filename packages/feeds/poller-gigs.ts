import pLimit from 'p-limit';
import { NormalizedEvent } from './normalize';
import { readCache, writeCache } from './cache';
import { safeFetch } from '../../apps/web/src/lib/safe-fetch';

export interface FetchError {
  source: string;
  code: string;
  message: string;
  fromCache: boolean;
}

export interface FetchAllSourcesOptions {
  concurrency?: number;
  enabledOnly?: boolean;
}

export interface FetchAllSourcesResult {
  events: NormalizedEvent[];
  errors: FetchError[];
}

export interface SourceAdapter {
  name: string;
  enabled: boolean;
  fetch: () => Promise<NormalizedEvent[]>;
}

const DEFAULT_CONCURRENCY = parseInt(process.env.POLL_CONCURRENCY || '4', 10);
const DEFAULT_TTL = parseInt(process.env.GIGS_CACHE_TTL_SECONDS || '900', 10);

export async function fetchAllSources(
  sources: SourceAdapter[],
  options: FetchAllSourcesOptions = {}
): Promise<FetchAllSourcesResult> {
  const { concurrency = DEFAULT_CONCURRENCY, enabledOnly = true } = options;
  
  const limit = pLimit(concurrency);
  const events: NormalizedEvent[] = [];
  const errors: FetchError[] = [];

  const sourcesToFetch = enabledOnly 
    ? sources.filter(s => s.enabled) 
    : sources;

  const fetchTasks = sourcesToFetch.map(source =>
    limit(async () => {
      try {
        console.log(`[Poller] Fetching ${source.name}...`);
        const sourceEvents = await source.fetch();
        
        if (sourceEvents.length > 0) {
          writeCache(source.name, sourceEvents, DEFAULT_TTL);
          events.push(...sourceEvents);
          console.log(`[Poller] ✓ ${source.name}: ${sourceEvents.length} events`);
        } else {
          console.log(`[Poller] ⚠ ${source.name}: 0 events`);
        }
      } catch (error: any) {
        console.error(`[Poller] ✗ ${source.name}:`, error.message);
        
        const cached = readCache(source.name, DEFAULT_TTL);
        if (cached && cached.events.length > 0) {
          const cachedEvents = cached.events.map(e => ({ ...e, fromCache: true }));
          events.push(...cachedEvents);
          errors.push({
            source: source.name,
            code: error.code || 'FETCH_ERROR',
            message: error.message || 'Unknown error',
            fromCache: true
          });
          console.log(`[Poller] 📦 ${source.name}: Using ${cached.events.length} cached events`);
        } else {
          errors.push({
            source: source.name,
            code: error.code || 'FETCH_ERROR',
            message: error.message || 'Unknown error',
            fromCache: false
          });
        }
      }
    })
  );

  await Promise.all(fetchTasks);

  return { events, errors };
}
