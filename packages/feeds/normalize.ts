
import crypto from 'crypto';

export interface NormalizedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue: string;
  city?: string;
  price?: string;
  url: string;
  source: string;
  image?: string;
  description?: string;
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

export function generateEventHash(event: NormalizedEvent): string {
  const key = `${event.title}-${event.date}-${event.venue}`.toLowerCase().replace(/\s+/g, '');
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
  // Free AI enrichment using local heuristics
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
    date: normalizeDate(event.date),
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
