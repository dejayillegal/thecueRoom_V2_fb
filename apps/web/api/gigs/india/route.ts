
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In TEST_MODE, return mock gigs
    if (process.env.TEST_MODE === 'true') {
      return NextResponse.json({
        gigs: [
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
          {
            id: '2',
            title: 'House Music Festival',
            venue: 'Beach Resort',
            city: 'Goa',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            ticketUrl: 'https://bookmyshow.com',
            freeTicket: false,
            imageUrl: 'https://picsum.photos/seed/gig2/800/600',
          },
        ],
      });
    }

    // In production, aggregate from multiple sources
    // For now, return empty array
    return NextResponse.json({ gigs: [] });

  } catch (error) {
    console.error('India gigs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gigs' },
      { status: 500 }
    );
  }
}
