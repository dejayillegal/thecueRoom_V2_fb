import { NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db';
import type { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';
import { sql } from 'drizzle-orm';

// Simple in-memory cache to reduce API hits
const cache = new LRUCache({ max: 100, ttl: 1000 * 60 * 5 }); // 5 min TTL

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

    const db = getDbClient();

    // Fetch all approved events using Drizzle's raw SQL
    const result = await db.execute(sql`
      SELECT 
        id, title, venue, city, start_time as date, 
        ticket_url as "ticketUrl", image_url as "imageUrl",
        genres, source, visibility, status
      FROM gigs
      WHERE approved = true AND status = 'approved'
      ORDER BY start_time ASC
    `);

    const events = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      venue: row.venue,
      city: row.city,
      date: row.date,
      ticketUrl: row.ticketUrl,
      imageUrl: row.imageUrl,
      genre: row.genres || [],
      source: row.source,
      freeTicket: true, // Default for now since we don't have price in gigs table
    }));

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