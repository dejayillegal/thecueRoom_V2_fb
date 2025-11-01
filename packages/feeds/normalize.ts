
import crypto from 'crypto';

export interface NormalizedEvent {
  id: string;
  source: string;
  title: string;
  description?: string;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };
  startAt?: string;
  endAt?: string | null;
  timezone?: string;
  ticketUrl?: string | null;
  price?: string | null;
  image?: string | null;
  raw?: any;
  fetchedAt: string;
  fromCache?: boolean;
  genreTags?: string[];
}

export function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function normalizeEvent(raw: any, sourceMeta: { name: string; fromCache?: boolean }): NormalizedEvent {
  const sourceId = raw.id || raw.sourceId || raw.guid || '';
  const startAt = raw.startAt || raw.date || raw.pubDate || raw.published;
  
  const idString = `${sourceMeta.name}-${sourceId}-${startAt}`;
  const id = crypto.createHash('sha1').update(idString).digest('hex');

  return {
    id,
    source: sourceMeta.name,
    title: raw.title || 'Untitled Event',
    description: raw.description || raw.contentSnippet || raw.summary,
    venue: raw.venue ? (typeof raw.venue === 'string' ? { name: raw.venue } : raw.venue) : undefined,
    startAt: startAt ? normalizeDate(startAt) : undefined,
    endAt: raw.endAt ? normalizeDate(raw.endAt) : null,
    timezone: raw.timezone,
    ticketUrl: raw.ticketUrl || raw.link || null,
    price: raw.price,
    image: raw.image || raw.enclosure?.url || null,
    raw,
    fetchedAt: new Date().toISOString(),
    fromCache: sourceMeta.fromCache || false,
    genreTags: raw.genreTags || []
  };
}

export function generateEventHash(event: NormalizedEvent): string {
  const venueStr = typeof event.venue === 'string' ? event.venue : (event.venue?.name || '');
  const key = `${event.title}-${event.startAt}-${venueStr}`.toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('md5').update(key).digest('hex');
}

export function deduplicateEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const seen = new Set<string>();
  const deduplicated: NormalizedEvent[] = [];
  
  for (const event of events) {
    const hash = generateEventHash(event);
    if (!seen.has(hash)) {
      seen.add(hash);
      deduplicated.push(event);
    }
  }
  
  return deduplicated;
}

export function enrichWithAI(event: NormalizedEvent): NormalizedEvent {
  const text = `${event.title} ${event.description || ''}`.toLowerCase();
  
  const genreKeywords: Record<string, string[]> = {
    techno: ['techno', 'underground', 'minimal', 'industrial'],
    house: ['house', 'deep house', 'progressive'],
    trance: ['trance', 'psytrance', 'goa'],
    dubstep: ['dubstep', 'bass', 'dnb', 'drum and bass'],
    indie: ['indie', 'alternative', 'rock'],
    hiphop: ['hip hop', 'rap', 'trap'],
    jazz: ['jazz', 'blues', 'soul'],
    live: ['live', 'concert', 'performance'],
  };
  
  const detectedGenres: string[] = [];
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      detectedGenres.push(genre);
    }
  }
  
  return {
    ...event,
    genreTags: [...new Set([...(event.genreTags || []), ...detectedGenres])],
    startAt: event.startAt ? normalizeDate(event.startAt) : undefined,
  };
}

export async function validateEventUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}
