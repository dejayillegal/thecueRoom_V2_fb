
import * as cheerio from 'cheerio';
import { NormalizedEvent } from '../normalize';
import { safeFetch } from '../../../apps/web/src/lib/safe-fetch';
import { readCache, writeCache } from '../cache';

const CACHE_TTL_SEC = 600;

function extractCity(title: string, venue: string): string {
  const text = `${title} ${venue}`.toLowerCase();
  const cities = ['bangalore', 'mumbai', 'delhi', 'goa', 'pune', 'hyderabad', 'chennai', 'kolkata'];
  
  for (const city of cities) {
    if (text.includes(city) || text.includes(city.substring(0, 3))) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return 'India';
}

export async function fetchSortMyScene(): Promise<NormalizedEvent[]> {
  try {
    const response = await safeFetch('https://sortmyscene.com/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
      },
      timeout: 8000,
      attempts: 3,
    });
    
    if (!response.ok) {
      const cached = readCache('sortmyscene', CACHE_TTL_SEC);
      if (cached) {
        return cached.events;
      }
      return [];
    }
    
    const html = response.text || '';
    const $ = cheerio.load(html);
    const events: NormalizedEvent[] = [];
    
    $('.event-card, .card, article, .event_listing .event').each((idx, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .event-title, .card-title').first().text().trim();
      const venue = $el.find('.venue, .location').first().text().trim();
      const dateText = $el.find('.date, time').first().text().trim();
      const link = $el.find('a').first().attr('href') || $el.attr('href');
      
      if (title && link) {
        events.push({
          id: `sortmyscene-${idx}`,
          title,
          date: dateText || new Date().toISOString(),
          venue: venue || 'TBA',
          city: extractCity(title, venue),
          url: link.startsWith('http') ? link : `https://sortmyscene.com${link}`,
          source: 'SortMyScene',
          image: $el.find('img').first().attr('src'),
          genreTags: [],
        });
      }
    });
    
    if (events.length > 0) {
      writeCache('sortmyscene', events, CACHE_TTL_SEC);
    }
    
    return events;
  } catch (error) {
    console.error('SortMyScene fetch error:', error);
    const cached = readCache('sortmyscene', CACHE_TTL_SEC);
    return cached ? cached.events : [];
  }
}
