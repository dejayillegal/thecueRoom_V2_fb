
import { NormalizedEvent } from '../normalize';

export async function fetchSkillboxIndia(): Promise<NormalizedEvent[]> {
  try {
    const response = await fetch('https://api.skillboxes.com/api/events?country=India', {
      headers: {
        'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const events = data.events || data.data || [];
    
    return events
      .filter((e: any) => e.category?.toLowerCase().includes('music'))
      .map((event: any) => ({
        id: `skillbox-${event.id}`,
        title: event.title || event.name,
        date: event.date || event.start_date,
        venue: event.venue || 'TBA',
        city: event.city || 'India',
        price: event.price,
        url: event.url || `https://skillboxes.com/events/${event.id}`,
        source: 'Skillbox India',
        image: event.image || event.thumbnail,
        description: event.description,
        genreTags: event.tags || [],
      }));
  } catch (error) {
    console.error('Skillbox India fetch error:', error);
    return [];
  }
}
