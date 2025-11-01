
import { NormalizedEvent } from '../normalize';

export async function fetchPaytmInsider(): Promise<NormalizedEvent[]> {
  try {
    const response = await fetch('https://api.insider.in/all-cities/events/music', {
      headers: {
        'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const events = data.events || [];
    
    return events.map((event: any) => ({
      id: `paytm-${event.id}`,
      title: event.name || event.title,
      date: event.start_time || event.date,
      venue: event.venue?.name || 'TBA',
      city: event.venue?.city || 'India',
      price: event.min_price ? `₹${event.min_price}+` : undefined,
      url: event.share_url || `https://insider.in/event/${event.slug}`,
      source: 'Paytm Insider',
      image: event.poster_url || event.vertical_cover_image,
      description: event.description,
      genreTags: event.category ? [event.category] : [],
    }));
  } catch (error) {
    console.error('Paytm Insider fetch error:', error);
    return [];
  }
}
