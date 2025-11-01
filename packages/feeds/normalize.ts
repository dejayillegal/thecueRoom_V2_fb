export interface NormalizedEvent {
  id: string;
  title: string;
  venue?: string;
  city?: string;
  startAt?: string; // ISO 8601
  endAt?: string;
  url: string;
  ticketUrl?: string;
  price?: string;
  freeTicket?: boolean;
  imageUrl?: string;
  description?: string;
  source: string;
  genreTags?: string[];
  fromCache?: boolean;
  raw?: any;
}

export function normalizeDate(input: any): string {
  if (!input) return new Date().toISOString();

  if (typeof input === 'string') {
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  return new Date().toISOString();
}

export function deduplicateEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const seen = new Map<string, NormalizedEvent>();

  for (const event of events) {
    const key = `${event.title.toLowerCase().trim()}-${event.venue?.toLowerCase().trim()}-${event.startAt}`;

    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // Prefer event with more complete data
      const existing = seen.get(key)!;
      if ((event.ticketUrl && !existing.ticketUrl) || (event.imageUrl && !existing.imageUrl)) {
        seen.set(key, event);
      }
    }
  }

  return Array.from(seen.values());
}

export function enrichWithAI(event: NormalizedEvent): NormalizedEvent {
  // Placeholder for AI enrichment - can be expanded later
  return event;
}

export function parseStructuredData(html: string): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  const ldJsonRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = ldJsonRegex.exec(html)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const data = JSON.parse(jsonStr);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item['@type'] === 'Event') {
          events.push({
            id: `ld-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: item.name || 'Untitled Event',
            venue: item.location?.name || item.location?.address?.name,
            city: item.location?.address?.addressLocality,
            startAt: normalizeDate(item.startDate),
            endAt: item.endDate ? normalizeDate(item.endDate) : undefined,
            url: item.url || '',
            imageUrl: item.image?.url || item.image,
            description: item.description,
            source: 'Structured Data',
            raw: item
          });
        }
      }
    } catch (err) {
      // Invalid JSON, skip
    }
  }

  return events;
}