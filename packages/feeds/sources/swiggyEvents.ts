
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';

const CACHE_TTL_SEC = 600; // 10 minutes

export interface FetchError {
  source: string;
  code: string;
  message: string;
}

export async function fetchSwiggyEvents(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  
  try {
    const res = await safeFetch('https://steppinout.swiggy.com/api/events', {
      headers: {
        'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
      },
      timeout: 8000,
      attempts: 3,
    });

    if (!res.ok) {
      errors.push({
        source: 'swiggy',
        code: res.error?.code || `http_${res.status}`,
        message: res.error?.message || res.text?.slice(0, 300) || 'Unknown error',
      });

      // Try cache fallback
      const cached = readCache('swiggy', CACHE_TTL_SEC);
      if (cached) {
        return { events: cached.events, errors, fromCache: true };
      }
      return { events: [], errors };
    }

    // Parse response (placeholder - adjust based on actual API structure)
    const data = res.json || JSON.parse(res.text || '[]');
    const events: NormalizedEvent[] = [];

    // TODO: Parse Swiggy API response structure when available
    // This is a placeholder implementation

    writeCache('swiggy', events, CACHE_TTL_SEC);
    return { events, errors };
  } catch (error: any) {
    errors.push({
      source: 'swiggy',
      code: 'FETCH_FAILED',
      message: error.message || 'Fetch failed',
    });

    const cached = readCache('swiggy', CACHE_TTL_SEC);
    if (cached) {
      return { events: cached.events, errors, fromCache: true };
    }
    return { events: [], errors };
  }
}
