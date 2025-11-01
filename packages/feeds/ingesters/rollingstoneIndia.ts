
import { Parser } from 'fast-xml-parser';
import dayjs from 'dayjs';

export interface GigEvent {
  id: string;
  title: string;
  artist?: string;
  date: Date;
  venue?: string;
  location?: string;
  region?: string;
  genre?: string;
  ticketUrl?: string;
  ticketType: 'free' | 'rsvp' | 'paid';
  imageUrl?: string;
  description?: string;
  source: string;
  sourceUrl: string;
  hash: string;
}

const normalizeDate = (dateStr: string): Date => {
  return dayjs(dateStr).toDate();
};

const hashEvent = (title: string, date: Date, venue: string): string => {
  const str = `${title}-${date.toISOString()}-${venue}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const ingestRollingstoneIndia = async (feedUrl: string): Promise<GigEvent[]> => {
  const response = await fetch(feedUrl);
  const xml = await response.text();
  
  const parser = new Parser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  
  const result = parser.parse(xml);
  const events: GigEvent[] = [];
  
  const items = result.rss?.channel?.item || [];
  const itemsArray = Array.isArray(items) ? items : [items];
  
  itemsArray.forEach((item: any, idx: number) => {
    const title = item.title || 'Untitled Event';
    const date = item.pubDate ? normalizeDate(item.pubDate) : new Date();
    const venue = item.venue || item['gigpress:venue'] || 'TBA';
    const location = item.location || item['gigpress:city'] || 'India';
    
    const event: GigEvent = {
      id: `rs-india-${Date.now()}-${idx}`,
      title,
      date,
      venue,
      location,
      region: location,
      ticketUrl: item.link || item['gigpress:tickets'],
      ticketType: item['gigpress:price']?.toLowerCase().includes('free') ? 'free' : 'paid',
      imageUrl: item.enclosure?.['@_url'] || item['media:thumbnail']?.['@_url'],
      description: item.description || item['content:encoded'],
      source: 'Rolling Stone India',
      sourceUrl: item.link || feedUrl,
      hash: hashEvent(title, date, venue)
    };
    
    events.push(event);
  });
  
  return events;
};
