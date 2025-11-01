
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';
import * as cheerio from 'cheerio';

const CACHE_TTL_SEC = 600;

export interface FetchError {
  source: string;
  code: string;
  message: string;
}

export async function fetchZomatoLive(): Promise<{ events: NormalizedEvent[]; errors: FetchError[]; fromCache?: boolean }> {
  const errors: FetchError[] = [];
  
  try {
    const res = await safeFetch('https://www.zomato.com/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
      },
      timeout: 8000,
      attempts: 2,
    });

    if (!res.ok) {
      errors.push({
        source: 'Zomato Live',
        code: res.error?.code || `HTTP_${res.status}`,
        message: res.error?.message || res.text?.slice(0, 300) || 'Unknown error',
      });

      const cached = readCache('zomato', CACHE_TTL_SEC);
      if (cached) {
        return { events: cached.events, errors, fromCache: true };
      }
      return { events: [], errors };
    }

    const $ = cheerio.load(res.text || '');
    const events: NormalizedEvent[] = [];
    
    $('a[href*="/events/"], .event-card, [data-event-id]').each((idx, el) => {
      const $el = $(el);
      const link = $el.attr('href') || $el.find('a').attr('href') || '';
      const title = $el.text().trim() || $el.find('h3, h2').text().trim();
      
      if (title && link) {
        events.push({
          id: `zomato-${idx}`,
          title,
          date: new Date().toISOString(),
          venue: 'TBA',
          city: 'India',
          url: link.startsWith('http') ? link : `https://www.zomato.com${link}`,
          source: 'Zomato Live',
          genreTags: ['music'],
        });
      }
    });

    writeCache('zomato', events, CACHE_TTL_SEC);
    return { events, errors };
    
  } catch (error: any) {
    errors.push({
      source: 'Zomato Live',
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
