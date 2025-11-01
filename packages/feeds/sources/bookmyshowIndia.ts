
import * as cheerio from 'cheerio';
import { NormalizedEvent, parseStructuredData } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';
import { renderWithPlaywright } from '../headless';

const CACHE_KEY = 'bookmyshow';
const CACHE_TTL_SEC = 600;

export interface FetchError {
  source: string;
  code: string;
  message: string;
  fromCache?: boolean;
}

async function tryJsonApi(city: string): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  const url = `https://in.bookmyshow.com/api/explore/v2/home/${city}`;
  
  const res = await safeFetch(url, {
    timeout: 8000,
    attempts: 2,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
    }
  });

  if (res.ok && res.json) {
    const data = res.json;
    const collections = data.collections || [];
    
    for (const collection of collections) {
      const items = collection.items || [];
      for (const item of items) {
        if (item.type === 'event' || item.event) {
          const event = item.event || item;
          events.push({
            id: `bookmyshow-${event.id || Math.random()}`,
            title: event.name || event.eventTitle,
            venue: event.venue?.name,
            city: city.charAt(0).toUpperCase() + city.slice(1),
            startAt: new Date().toISOString(),
            url: `https://in.bookmyshow.com/events/${event.slug || event.id}`,
            imageUrl: event.image || event.imageUrl,
            source: 'BookMyShow',
            genreTags: ['music']
          });
        }
      }
    }
  }
  
  return events;
}

async function tryStructuredData(city: string): Promise<NormalizedEvent[]> {
  const url = `https://in.bookmyshow.com/explore/home/${city}`;
  
  const res = await safeFetch(url, {
    timeout: 10000,
    attempts: 2,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!res.ok || !res.text) {
    throw new Error(`HTTP ${res.status}: ${res.error?.message}`);
  }

  const events = parseStructuredData(res.text);
  return events.map((e, idx) => ({
    ...e,
    id: `bookmyshow-${city}-ld-${idx}`,
    city: city.charAt(0).toUpperCase() + city.slice(1),
    source: 'BookMyShow'
  }));
}

async function tryHeadless(city: string): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  const url = `https://in.bookmyshow.com/explore/home/${city}`;
  
  const headlessResult = await renderWithPlaywright(url, {
    selector: 'a[href*="/events/"], .event-card',
    timeout: 12000,
    waitForSelector: 'a[href*="/events/"]'
  });
  
  if (headlessResult.ok && headlessResult.elements) {
    headlessResult.elements.forEach((html: string, idx: number) => {
      const $el = cheerio.load(html);
      const link = $el('a').attr('href') || '';
      const title = $el('a').text().trim() || $el('h3, h2').text().trim();
      
      if (title && link) {
        events.push({
          id: `bookmyshow-${city}-hw-${idx}`,
          title,
          venue: 'TBA',
          city: city.charAt(0).toUpperCase() + city.slice(1),
          url: link.startsWith('http') ? link : `https://in.bookmyshow.com${link}`,
          source: 'BookMyShow',
          genreTags: ['music']
        });
      }
    });
  }
  
  return events;
}

export async function fetchBookMyShow(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  const cities = ['bangalore', 'mumbai', 'delhi', 'pune', 'goa'];
  const allEvents: NormalizedEvent[] = [];
  
  for (const city of cities) {
    try {
      // Strategy 1: JSON API
      let cityEvents = await tryJsonApi(city);
      
      if (cityEvents.length === 0) {
        // Strategy 2: Structured data
        cityEvents = await tryStructuredData(city);
      }
      
      if (cityEvents.length === 0 && process.env.PLAYWRIGHT_ENABLED === 'true') {
        // Strategy 3: Headless
        cityEvents = await tryHeadless(city);
      }
      
      allEvents.push(...cityEvents);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      
    } catch (error: any) {
      console.error(`[BookMyShow] Failed for ${city}:`, error.message);
    }
  }
  
  if (allEvents.length > 0) {
    writeCache(CACHE_KEY, allEvents, CACHE_TTL_SEC);
    return { events: allEvents, errors };
  }
  
  // Fallback to cache
  const cached = readCache(CACHE_KEY, CACHE_TTL_SEC);
  if (cached && Array.isArray(cached.data)) {
    return { events: cached.data, errors: [{
      source: 'BookMyShow',
      code: 'FETCH_FAILED',
      message: 'Using cached data',
      fromCache: true
    }], fromCache: true };
  }
  
  return { events: [], errors };
}
