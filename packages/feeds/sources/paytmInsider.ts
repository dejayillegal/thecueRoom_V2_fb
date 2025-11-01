
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';

const CACHE_TTL_SEC = 600;

export interface FetchError {
  source: string;
  code: string;
  message: string;
}

export async function fetchPaytmInsider(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  
  try {
    // Try Paytm Insider API
    const res = await safeFetch('https://insider.in/api/events?city=all&category=music', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
        'Accept': 'application/json',
      },
      timeout: 8000,
      attempts: 3,
    });

    if (!res.ok) {
      errors.push({
        source: 'Paytm Insider',
        code: res.error?.code || `HTTP_${res.status}`,
        message: res.error?.message || res.text?.slice(0, 300) || 'Unknown error',
      });

      const cached = readCache('paytm', CACHE_TTL_SEC);
      if (cached) {
        return { events: cached.events, errors, fromCache: true };
      }
      return { events: [], errors };
    }

    const data = res.json || JSON.parse(res.text || '{}');
    const rawEvents = data.events || data.data || [];
    
    const events: NormalizedEvent[] = rawEvents.map((event: any, idx: number) => ({
      id: `paytm-${event.id || idx}`,
      title: event.name || event.title || 'Untitled Event',
      date: event.start_time || event.date || new Date().toISOString(),
      venue: event.venue?.name || 'TBA',
      city: event.venue?.city || event.city || 'India',
      price: event.min_price ? `₹${event.min_price}+` : undefined,
      url: event.share_url || event.url || `https://insider.in/event/${event.slug || event.id}`,
      source: 'Paytm Insider',
      image: event.poster_url || event.vertical_cover_image || event.image,
      description: event.description,
      genreTags: event.category ? [event.category] : [],
    }));

    writeCache('paytm', events, CACHE_TTL_SEC);
    return { events, errors };
    
  } catch (error: any) {
    errors.push({
      source: 'Paytm Insider',
      code: 'FETCH_FAILED',
      message: error.message || 'Fetch failed',
    });

    const cached = readCache('paytm', CACHE_TTL_SEC);
    if (cached) {
      return { events: cached.events, errors, fromCache: true };
    }
    return { events: [], errors };
  }
}
