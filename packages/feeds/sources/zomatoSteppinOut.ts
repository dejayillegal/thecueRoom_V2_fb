
import * as cheerio from 'cheerio';
import { NormalizedEvent } from '../normalize';

export async function fetchZomatoLive(): Promise<NormalizedEvent[]> {
  try {
    const response = await fetch('https://live.dineout.co.in/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
      },
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const events: NormalizedEvent[] = [];
    
    $('.event-card, .card, article').each((idx, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .title').first().text().trim();
      const venue = $el.find('.venue, .location').first().text().trim();
      const link = $el.find('a').first().attr('href');
      
      if (title && link) {
        events.push({
          id: `zomato-${idx}`,
          title,
          date: new Date().toISOString(),
          venue: venue || 'TBA',
          city: 'India',
          url: link.startsWith('http') ? link : `https://live.dineout.co.in${link}`,
          source: 'Zomato Live',
          image: $el.find('img').first().attr('src'),
          genreTags: [],
        });
      }
    });
    
    return events;
  } catch (error) {
    console.error('Zomato Live fetch error:', error);
    return [];
  }
}
