
import * as cheerio from 'cheerio';
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';
import { renderWithPlaywright } from '../headless';

const CACHE_TTL_SEC = 600;

export interface FetchError {
  source: string;
  code: string;
  message: string;
  fromCache?: boolean;
}

async function scrapeBookMyShow(city: string): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  const url = `https://in.bookmyshow.com/explore/home/${city}`;
  
  const res = await safeFetch(url, {
    timeout: 10000,
    attempts: 2,
  });

  if (!res.ok) {
    throw new Error(res.error?.message || 'Failed to fetch BookMyShow');
  }

  const $ = cheerio.load(res.text || '');
  
  // Check if page is client-side rendered
  const isCSR = $('div#__next').length > 0 && $('a[href*="/events/"]').length === 0;
  
  if (isCSR && process.env.PLAYWRIGHT_ENABLED === 'true') {
    // Use headless rendering
    const headlessResult = await renderWithPlaywright(url, {
      selector: 'a[href*="/events/"]',
      timeout: 8000,
      waitForSelector: 'a[href*="/events/"]'
    });
    
    if (headlessResult.ok && headlessResult.elements) {
      headlessResult.elements.forEach((html: string, idx: number) => {
        const $el = cheerio.load(html);
        const link = $el('a').attr('href') || '';
        const title = $el('a').text().trim() || $el('h3').text().trim();
        
        if (title && link) {
          events.push({
            id: `bookmyshow-${city}-${idx}`,
            title,
            date: new Date().toISOString(),
            venue: 'TBA',
            city: city.charAt(0).toUpperCase() + city.slice(1),
            url: link.startsWith('http') ? link : `https://in.bookmyshow.com${link}`,
            source: 'BookMyShow',
            genreTags: ['music'],
          });
        }
      });
    }
  } else {
    // Regular HTML scraping
    $('a[href*="/events/"], a[href*="/buytickets/"], .event-card a, .card a[href*="bookmyshow"]').each((idx, el) => {
      const $el = $(el);
      const link = $el.attr('href') || '';
      const title = $el.text().trim() || $el.find('h3, h2, .event-title').text().trim();
      
      if (title && link && !events.find(e => e.url.includes(link))) {
        events.push({
          id: `bookmyshow-${city}-${idx}`,
          title,
          date: new Date().toISOString(),
          venue: 'TBA',
          city: city.charAt(0).toUpperCase() + city.slice(1),
          url: link.startsWith('http') ? link : `https://in.bookmyshow.com${link}`,
          source: 'BookMyShow',
          genreTags: ['music'],
        });
      }
    });
  }
  
  return events;
}

export async function fetchBookMyShow(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  const cities = ['bangalore', 'mumbai', 'delhi', 'pune', 'goa'];
  
  try {
    const allEvents: NormalizedEvent[] = [];
    
    for (const city of cities) {
      try {
        const cityEvents = await scrapeBookMyShow(city);
        allEvents.push(...cityEvents);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error: any) {
        console.error(`[BookMyShow] Failed for ${city}:`, error.message);
      }
    }
    
    if (allEvents.length > 0) {
      writeCache('bookmyshow', allEvents, CACHE_TTL_SEC);
      return { events: allEvents, errors };
    }
    
    throw new Error('No events found from any city');
    
  } catch (error: any) {
    errors.push({
      source: 'BookMyShow',
      code: error.code || 'FETCH_ERROR',
      message: error.message || 'Unknown error',
    });
    
    // Try cache fallback
    const cached = readCache('bookmyshow', CACHE_TTL_SEC);
    if (cached && cached.events.length > 0) {
      return { events: cached.events, errors, fromCache: true };
    }
    
    return { events: [], errors };
  }
}
