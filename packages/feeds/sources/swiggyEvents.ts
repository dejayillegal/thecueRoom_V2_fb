
import { NormalizedEvent } from '../normalize';

export async function fetchSwiggyEvents(): Promise<NormalizedEvent[]> {
  try {
    const response = await fetch('https://steppinout.swiggy.com/api/events', {
      headers: {
        'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const events = data.events || data.data || [];
    
    return events.map((event: any) => ({
      id: `swiggy-${event.id}`,
      title: event.name || event.title,
      date: event.event_date || event.date,
      venue: event.venue_name || 'TBA',
      city: event.city || 'India',
      price: event.price_range,
      url: event.url || `https://steppinout.swiggy.com/events/${event.slug}`,
      source: 'Swiggy SteppinOut',
      image: event.image_url || event.thumbnail,
      description: event.description,
      genreTags: event.categories || [],
    }));
  } catch (error) {
    console.error('Swiggy Events fetch error:', error);
    return [];
  }
}
