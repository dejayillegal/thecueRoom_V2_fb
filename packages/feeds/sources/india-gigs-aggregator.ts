
import { safeFetch } from '../safeFetch';

export interface GigEvent {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  time?: string;
  price?: string;
  ticketUrl?: string;
  imageUrl?: string;
  description?: string;
  artists?: string[];
  genre?: string[];
  source: string;
  sourceUrl: string;
  createdAt: string;
}

export interface GigSource {
  name: string;
  fetch: () => Promise<GigEvent[]>;
  enabled: boolean;
}

async function fetchBookMyShowIndia(): Promise<GigEvent[]> {
  try {
    const result = await safeFetch('https://in.bookmyshow.com/explore/concerts-mumbai', {
      timeout: 15000,
      attempts: 2,
    });
    
    if (!result.ok) {
      console.warn('BookMyShow fetch failed:', result.error);
      return [];
    }
    
    // Parse HTML and extract events (simplified)
    const events: GigEvent[] = [];
    
    // This would require actual HTML parsing
    // For now, return empty array as placeholder
    return events;
    
  } catch (error) {
    console.error('BookMyShow error:', error);
    return [];
  }
}

async function fetchZomatoLive(): Promise<GigEvent[]> {
  try {
    const result = await safeFetch('https://www.zomato.com/live/api/events', {
      timeout: 15000,
      attempts: 2,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; thecueRoom/2.0)',
      },
    });
    
    if (!result.ok || !result.json) {
      return [];
    }
    
    const data = result.json;
    const events: GigEvent[] = [];
    
    // Parse Zomato API response
    if (Array.isArray(data.events)) {
      for (const event of data.events) {
        events.push({
          id: `zomato-${event.id}`,
          title: event.name || 'Untitled Event',
          venue: event.venue?.name || 'TBA',
          city: event.city || 'India',
          date: event.date || new Date().toISOString(),
          time: event.time,
          price: event.price,
          ticketUrl: event.ticketUrl,
          imageUrl: event.image,
          description: event.description,
          artists: event.artists || [],
          genre: event.genres || [],
          source: 'Zomato Live',
          sourceUrl: `https://www.zomato.com/events/${event.id}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    return events;
    
  } catch (error) {
    console.error('Zomato Live error:', error);
    return [];
  }
}

async function fetchPaytmInsider(): Promise<GigEvent[]> {
  try {
    const result = await safeFetch('https://insider.in/api/events?city=mumbai&category=music', {
      timeout: 15000,
      attempts: 2,
    });
    
    if (!result.ok || !result.json) {
      return [];
    }
    
    const data = result.json;
    const events: GigEvent[] = [];
    
    if (Array.isArray(data.data)) {
      for (const event of data.data) {
        events.push({
          id: `insider-${event.id}`,
          title: event.title || 'Untitled Event',
          venue: event.venue || 'TBA',
          city: event.city || 'Mumbai',
          date: event.startDate || new Date().toISOString(),
          time: event.startTime,
          price: event.minPrice ? `₹${event.minPrice}` : undefined,
          ticketUrl: event.shareUrl,
          imageUrl: event.posterUrl,
          description: event.description,
          artists: event.artists || [],
          genre: event.categories || [],
          source: 'Paytm Insider',
          sourceUrl: event.shareUrl,
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    return events;
    
  } catch (error) {
    console.error('Paytm Insider error:', error);
    return [];
  }
}

const GIGS_SOURCES: GigSource[] = [
  {
    name: 'Zomato Live',
    fetch: fetchZomatoLive,
    enabled: true,
  },
  {
    name: 'Paytm Insider',
    fetch: fetchPaytmInsider,
    enabled: true,
  },
  {
    name: 'BookMyShow',
    fetch: fetchBookMyShowIndia,
    enabled: false, // Disabled until HTML parser implemented
  },
];

export async function aggregateIndiaGigs(): Promise<{
  events: GigEvent[];
  sources: { name: string; count: number; success: boolean }[];
}> {
  const results = await Promise.allSettled(
    GIGS_SOURCES.filter(s => s.enabled).map(async source => ({
      name: source.name,
      events: await source.fetch(),
    }))
  );
  
  const allEvents: GigEvent[] = [];
  const sourceStats: { name: string; count: number; success: boolean }[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { name, events } = result.value;
      allEvents.push(...events);
      sourceStats.push({
        name,
        count: events.length,
        success: true,
      });
    } else {
      sourceStats.push({
        name: 'Unknown',
        count: 0,
        success: false,
      });
    }
  }
  
  // Deduplicate by title + date
  const seen = new Set<string>();
  const uniqueEvents = allEvents.filter(event => {
    const key = `${event.title}-${event.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return {
    events: uniqueEvents,
    sources: sourceStats,
  };
}
