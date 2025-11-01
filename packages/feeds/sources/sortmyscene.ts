
import * as cheerio from 'cheerio';
import { NormalizedEvent } from '../normalize';

export async function fetchSortMyScene(): Promise<NormalizedEvent[]> {
  try {
    const response = await fetch('https://sortmyscene.com/events', {
      headers: {
        'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
      },
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const events: NormalizedEvent[] = [];
    
    $('.event-card, .card, article').each((idx, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .event-title, .card-title').first().text().trim();
      const venue = $el.find('.venue, .location').first().text().trim();
      const dateText = $el.find('.date, time').first().text().trim();
      const link = $el.find('a').first().attr('href');
      
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
    
    return events;
  } catch (error) {
    console.error('SortMyScene fetch error:', error);
    return [];
  }
}

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
