
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
  methodAttempted?: string;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
];

async function tryJsonApi(city: string, errors: FetchError[]): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  
  for (let uaIndex = 0; uaIndex < USER_AGENTS.length; uaIndex++) {
    const url = `https://in.bookmyshow.com/api/explore/v2/home/${city}`;
    
    const res = await safeFetch(url, {
      timeout: 8000,
      attempts: 2,
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENTS[uaIndex],
        'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://in.bookmyshow.com/'
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
      
      if (events.length > 0) {
        return events;
      }
    } else if (res.error?.code === 'HTTP_403') {
      errors.push({
        source: 'BookMyShow',
        code: 'HTTP_403',
        message: `JSON API blocked (attempt ${uaIndex + 1}): ${res.error.message}`,
        methodAttempted: 'json-api'
      });
    }
  }
  
  return events;
}

async function tryStructuredData(city: string, errors: FetchError[]): Promise<NormalizedEvent[]> {
  const url = `https://in.bookmyshow.com/explore/home/${city}`;
  
  for (let uaIndex = 0; uaIndex < USER_AGENTS.length; uaIndex++) {
    const res = await safeFetch(url, {
      timeout: 10000,
      attempts: 2,
      headers: {
        'User-Agent': USER_AGENTS[uaIndex],
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IN,en-US;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    });

    if (res.ok && res.text) {
      const events = parseStructuredData(res.text);
      if (events.length > 0) {
        return events.map((e, idx) => ({
          ...e,
          id: `bookmyshow-${city}-ld-${idx}`,
          city: city.charAt(0).toUpperCase() + city.slice(1),
          source: 'BookMyShow'
        }));
      }
    } else if (res.error?.code === 'HTTP_403') {
      errors.push({
        source: 'BookMyShow',
        code: 'HTTP_403',
        message: `Structured data blocked (UA ${uaIndex + 1}): ${res.error.message}`,
        methodAttempted: 'structured-data'
      });
    }
  }
  
  return [];
}

async function tryHeadless(city: string, errors: FetchError[]): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  const url = `https://in.bookmyshow.com/explore/home/${city}`;
  
  // Try desktop first, then mobile
  for (const emulateMobile of [false, true]) {
    const headlessResult = await renderWithPlaywright(url, {
      selector: 'a[href*="/events/"], .event-card',
      timeout: 12000,
      waitForSelector: 'a[href*="/events/"]',
      emulateMobile,
      preferHeaders: {
        'Accept-Language': 'en-IN,en-US;q=0.9'
      }
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
      
      if (events.length > 0) {
        return events;
      }
    } else if (headlessResult.error) {
      errors.push({
        source: 'BookMyShow',
        code: 'HEADLESS_FAILED',
        message: `Headless (${emulateMobile ? 'mobile' : 'desktop'}) failed: ${headlessResult.error}`,
        methodAttempted: 'headless'
      });
    }
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
      let cityEvents = await tryJsonApi(city, errors);
      
      if (cityEvents.length === 0) {
        // Strategy 2: Structured data
        cityEvents = await tryStructuredData(city, errors);
      }
      
      if (cityEvents.length === 0 && process.env.PLAYWRIGHT_ENABLED === 'true') {
        // Strategy 3: Headless
        cityEvents = await tryHeadless(city, errors);
      }
      
      allEvents.push(...cityEvents);
      
      // Rate limiting between cities
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      errors.push({
        source: 'BookMyShow',
        code: 'CITY_FETCH_FAILED',
        message: `${city}: ${error.message}`,
        methodAttempted: 'all'
      });
    }
  }
  
  if (allEvents.length > 0) {
    writeCache(CACHE_KEY, allEvents, CACHE_TTL_SEC);
    return { events: allEvents, errors };
  }
  
  // Fallback to cache
  const cached = readCache(CACHE_KEY, CACHE_TTL_SEC);
  if (cached && Array.isArray(cached.data)) {
    errors.push({
      source: 'BookMyShow',
      code: 'USING_CACHE',
      message: 'All fetch methods failed, using cached data',
      fromCache: true,
      methodAttempted: 'cache-fallback'
    });
    return { events: cached.data, errors, fromCache: true };
  }
  
  return { events: [], errors };
}
