
import * as cheerio from 'cheerio';
import { NormalizedEvent } from '../normalize';

export async function fetchBookMyShow(): Promise<NormalizedEvent[]> {
  try {
    const cities = ['bangalore', 'mumbai', 'delhi', 'pune'];
    const allEvents: NormalizedEvent[] = [];
    
    for (const city of cities) {
      const response = await fetch(`https://in.bookmyshow.com/explore/music-${city}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
        },
      });
      
      if (!response.ok) continue;
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      $('.card__event-name, .event-card, [data-event-name]').each((idx, el) => {
        const $el = $(el);
        const title = $el.text().trim() || $el.attr('data-event-name');
        const link = $el.closest('a').attr('href');
        
        if (title && link) {
          allEvents.push({
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return allEvents;
  } catch (error) {
    console.error('BookMyShow fetch error:', error);
    return [];
  }
}
