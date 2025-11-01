
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';
import { renderWithPlaywright } from '../headless';

const CACHE_TTL_SEC = 600;

export interface FetchError {
  source: string;
  code: string;
  message: string;
}

export async function fetchSwiggyEvents(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  
  try {
    // First try API endpoint
    let res = await safeFetch('https://steppinout.swiggy.com/api/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
        'Accept': 'application/json',
      },
      timeout: 8000,
      attempts: 2,
    });

    let events: NormalizedEvent[] = [];

    if (res.ok && res.json) {
      const data = res.json;
      const rawEvents = Array.isArray(data) ? data : (data.events || data.data || []);
      
      events = rawEvents.map((event: any, idx: number) => ({
        id: `swiggy-${event.id || idx}`,
        title: event.name || event.title || 'Untitled Event',
        date: event.start_time || event.date || new Date().toISOString(),
        venue: event.venue?.name || event.venue || 'TBA',
        city: event.city || 'India',
        price: event.price ? `₹${event.price}` : undefined,
        url: event.url || `https://steppinout.swiggy.com/event/${event.id}`,
        source: 'Swiggy Events',
        image: event.image || event.poster,
        genreTags: event.category ? [event.category] : [],
      }));
    } else if (process.env.PLAYWRIGHT_ENABLED === 'true') {
      // Fallback to headless scraping
      const headlessResult = await renderWithPlaywright('https://steppinout.swiggy.com', {
        selector: '.card, a[href*="/events/"]',
        timeout: 10000,
      });
      
      if (headlessResult.ok && headlessResult.elements) {
        // Parse extracted elements (implementation depends on actual HTML structure)
        console.log('[Swiggy] Using headless rendering - manual parsing needed');
      }
    }

    if (events.length > 0) {
      writeCache('swiggy', events, CACHE_TTL_SEC);
      return { events, errors };
    }

    throw new Error('No events found');
    
  } catch (error: any) {
    errors.push({
      source: 'Swiggy Events',
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
