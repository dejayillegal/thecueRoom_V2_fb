
import * as cheerio from 'cheerio';

export interface NormalizedEvent {
  id: string;
  title: string;
  venue?: string;
  city?: string;
  startAt?: string;
  endAt?: string;
  url?: string;
  ticketUrl?: string;
  imageUrl?: string;
  source: string;
  description?: string;
  genreTags?: string[];
  fromCache?: boolean;
}

const BOLLYWOOD_PATTERNS = /bollywood|film|movie|actor|celebrity|awards|premiere|cinema|screening|trailer launch|starcast|filmi|masala|item song/i;

const VALID_GENRES = [
  'techno', 'house', 'electronic', 'bass', 'drum and bass', 'dnb',
  'dubstep', 'trap', 'experimental', 'ambient', 'idm', 'minimal',
  'deep house', 'tech house', 'progressive', 'trance', 'psytrance',
  'goa', 'hardstyle', 'hardcore', 'electro', 'breaks', 'breakbeat',
  'garage', 'future bass', 'downtempo', 'trip hop', 'glitch',
  'techno', 'underground', 'rave', 'club', 'dj', 'live set'
];

export function isBollywoodEvent(title: string, description?: string): boolean {
  const text = `${title} ${description || ''}`.toLowerCase();
  return BOLLYWOOD_PATTERNS.test(text);
}

export function hasValidGenre(title: string, description?: string, genres?: string[]): boolean {
  const text = `${title} ${description || ''} ${(genres || []).join(' ')}`.toLowerCase();
  
  // Check if any valid genre is mentioned
  return VALID_GENRES.some(genre => text.includes(genre.toLowerCase()));
}

export function filterEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  return events.filter(event => {
    // Filter out Bollywood/pop events
    if (isBollywoodEvent(event.title, event.description)) {
      console.log(`[Filter] Excluded Bollywood event: ${event.title}`);
      return false;
    }

    // Keep events with valid electronic music genres
    const isValid = hasValidGenre(event.title, event.description, event.genreTags);
    if (!isValid) {
      console.log(`[Filter] Excluded non-electronic event: ${event.title}`);
    }
    return isValid;
  });
}

export function deduplicateEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const seen = new Set<string>();
  const unique: NormalizedEvent[] = [];

  for (const event of events) {
    const key = `${event.title.toLowerCase()}-${event.venue?.toLowerCase()}-${event.startAt}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(event);
    }
  }

  return unique;
}

export function enrichWithAI(event: NormalizedEvent): NormalizedEvent {
  const text = `${event.title} ${event.description || ''}`.toLowerCase();
  const inferredGenres: string[] = [];

  VALID_GENRES.forEach(genre => {
    if (text.includes(genre.toLowerCase())) {
      inferredGenres.push(genre);
    }
  });

  return {
    ...event,
    genreTags: [...new Set([...(event.genreTags || []), ...inferredGenres])],
  };
}

export function parseStructuredData(html: string): NormalizedEvent[] {
  const $ = cheerio.load(html);
  const events: NormalizedEvent[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      const items = Array.isArray(json) ? json : [json];

      items.forEach((item: any) => {
        if (item['@type'] === 'Event' || item['@type'] === 'MusicEvent') {
          events.push({
            id: `ld-${Date.now()}-${Math.random()}`,
            title: item.name,
            venue: item.location?.name,
            city: item.location?.address?.addressLocality,
            startAt: item.startDate,
            endAt: item.endDate,
            url: item.url,
            imageUrl: item.image,
            description: item.description,
            source: 'structured-data',
            genreTags: [],
          });
        }
      });
    } catch (err) {
      console.error('[Structured Data] Parse error:', err);
    }
  });

  return events;
}
