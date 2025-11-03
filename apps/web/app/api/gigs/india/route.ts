import { NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      ok: true,
      events,
      total: events.length,
      fromCache: false,
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

function writeCache(data: any) {
  try {
    ensureCacheDir();
    writeFileSync(CACHE_FILE, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }, null, 2));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function GET() {
  try {
    // Try cache first
    const cached = readCache();
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true,
      });
    }

    // Fetch fresh data
    const result = await aggregateIndiaGigs();

    const response = {
      events: result.events,
      sources: result.sources,
      total: result.events.length,
      timestamp: new Date().toISOString(),
    };

    // Cache the result
    writeCache(response);

    return NextResponse.json({
      ...response,
      fromCache: false,
    });

  } catch (error) {
    console.error('India gigs API error:', error);

    // Try to return stale cache on error
    const staleCache = readCache();
    if (staleCache) {
      return NextResponse.json({
        ...staleCache,
        fromCache: true,
        stale: true,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch gigs' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour