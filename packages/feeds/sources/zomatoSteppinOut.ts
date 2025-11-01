
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';

const CACHE_TTL_SEC = 600;

export interface FetchError {
  source: string;
  code: string;
  message: string;
}

export async function fetchZomatoLive(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  
  try {
    const res = await safeFetch('https://live.dineout.co.in/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
      },
      timeout: 8000,
      attempts: 3,
    });

    if (!res.ok) {
      errors.push({
        source: 'zomato',
        code: res.error?.code || `http_${res.status}`,
        message: res.error?.message || res.text?.slice(0, 300) || 'Unknown error',
      });

      const cached = readCache('zomato', CACHE_TTL_SEC);
      if (cached) {
        return { events: cached.events, errors, fromCache: true };
      }
      return { events: [], errors };
    }

    const events: NormalizedEvent[] = [];
    // TODO: Parse Zomato response when API structure is known

    writeCache('zomato', events, CACHE_TTL_SEC);
    return { events, errors };
  } catch (error: any) {
    errors.push({
      source: 'zomato',
      code: 'FETCH_FAILED',
      message: error.message || 'Fetch failed',
    });

    const cached = readCache('zomato', CACHE_TTL_SEC);
    if (cached) {
      return { events: cached.events, errors, fromCache: true };
    }
    return { events: [], errors };
  }
}
