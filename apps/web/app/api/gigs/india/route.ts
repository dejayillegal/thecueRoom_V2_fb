import { NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db';
import type { NextRequest } from 'next/server';
import LRU from 'lru-cache';

// Simple in-memory cache to reduce API hits
const cache = new LRU({ max: 100, ttl: 1000 * 60 * 5 }); // 5 min TTL

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const cacheKey = 'india-gigs-aggregated';

    // Return cached data unless force refresh
    if (!force && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      return NextResponse.json({
        ok: true,
        events: cached,
        fromCache: true,
        meta: { totalSources: 0, sources: [] }
      });
    }

    const db = await getDbClient();

    // Fetch all approved events
    const result = await db.execute({
      sql: `
        SELECT 
          id, title, venue, city, event_date as date, event_time as time,
          price, ticket_url as ticketUrl, image_url as imageUrl,
          description, genre, source, source_url as sourceUrl
        FROM events
        WHERE status = 'approved'
        ORDER BY event_date ASC
      `,
      args: [],
    });

    const events = result.rows.map(row => ({
      ...row,
      genre: row.genre ? JSON.parse(row.genre as string) : [],
      freeTicket: !row.price || (row.price as string).toLowerCase().includes('free'),
    }));

    await db.close();

    // Cache successful results
    cache.set(cacheKey, events);

    return NextResponse.json({
      ok: true,
      events: events,
      fromCache: false,
      meta: { totalSources: 0, sources: [] }
    });
  } catch (error) {
    console.error('Gigs fetch error:', error);

    // Fallback to test data
    return NextResponse.json({
      ok: true,
      events: [
        {
          id: '1',
          title: 'Techno Night @ Bangalore',
          venue: 'Underground Warehouse',
          city: 'Bangalore',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ticketUrl: '#',
          freeTicket: true,
          imageUrl: 'https://picsum.photos/seed/gig1/800/600',
        },
      ],
      total: 1,
      fromCache: false,
      error: 'Database unavailable, using fallback',
    });
  }
}