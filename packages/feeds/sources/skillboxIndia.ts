
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';

const CACHE_TTL_SEC = 600;

export interface FetchError {
  source: string;
  code: string;
  message: string;
}

export async function fetchSkillboxIndia(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  
  try {
    const res = await safeFetch('https://api.skillboxes.com/api/events?country=India', {
      headers: {
        'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
      },
      timeout: 8000,
      attempts: 3,
    });

    if (!res.ok) {
      errors.push({
        source: 'skillbox',
        code: res.error?.code || `http_${res.status}`,
        message: res.error?.message || res.text?.slice(0, 300) || 'Unknown error',
      });

      const cached = readCache('skillbox', CACHE_TTL_SEC);
      if (cached) {
        return { events: cached.events, errors, fromCache: true };
      }
      return { events: [], errors };
    }

    const events: NormalizedEvent[] = [];
    // TODO: Parse Skillbox response

    writeCache('skillbox', events, CACHE_TTL_SEC);
    return { events, errors };
  } catch (error: any) {
    errors.push({
      source: 'skillbox',
      code: 'FETCH_FAILED',
      message: error.message || 'Fetch failed',
    });

    const cached = readCache('skillbox', CACHE_TTL_SEC);
    if (cached) {
      return { events: cached.events, errors, fromCache: true };
    }
    return { events: [], errors };
  }
}
