
import { NormalizedEvent } from '../normalize';

export async function fetchDiceIndia(): Promise<NormalizedEvent[]> {
  try {
    const response = await fetch('https://api.dice.fm/api/v1/events?country=IN', {
      headers: {
        'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const events = Array.isArray(data) ? data : (data.events || []);
    
    return events.map((event: any) => ({
      id: `dice-${event.id}`,
      title: event.name || event.title,
      date: event.date || event.start_time,
      time: event.doors_open,
      venue: event.venue?.name || 'TBA',
      city: event.venue?.city || 'India',
      price: event.price ? `₹${event.price}` : undefined,
      url: `https://dice.fm/event/${event.id}`,
      source: 'DICE India',
      image: event.images?.[0]?.url || event.image,
      description: event.description,
      genreTags: event.genres || [],
    }));
  } catch (error) {
    console.error('DICE India fetch error:', error);
    return [];
  }
}
