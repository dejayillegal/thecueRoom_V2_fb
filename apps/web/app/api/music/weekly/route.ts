
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    // Mock tracks for now - replace with actual data fetching
    const allTracks = [
      {
        id: '1',
        title: 'Deep Underground',
        artist: 'Test Artist',
        platform: 'bandcamp',
        url: 'https://bandcamp.com/track/test',
        imageUrl: 'https://picsum.photos/seed/track1/400/400',
        tags: ['techno', 'deep'],
      },
      {
        id: '2',
        title: 'Warehouse Vibes',
        artist: 'Another Artist',
        platform: 'soundcloud',
        url: 'https://soundcloud.com/track/test',
        imageUrl: 'https://picsum.photos/seed/track2/400/400',
        tags: ['house', 'underground'],
      },
      {
        id: '3',
        title: 'Midnight Sessions',
        artist: 'DJ Shadow',
        platform: 'mixcloud',
        url: 'https://mixcloud.com/track/test',
        imageUrl: 'https://picsum.photos/seed/track3/400/400',
        tags: ['ambient', 'experimental'],
      },
      {
        id: '4',
        title: 'Bass Frequencies',
        artist: 'Low End Theory',
        platform: 'beatport',
        url: 'https://beatport.com/track/test',
        imageUrl: 'https://picsum.photos/seed/track4/400/400',
        tags: ['bass', 'dubstep'],
      },
    ];

    const filteredTracks = !platform || platform === 'all' 
      ? allTracks 
      : allTracks.filter(track => track.platform === platform);

    return NextResponse.json(
      { tracks: filteredTracks },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Weekly music error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks', tracks: [] },
      { status: 500 }
    );
  }
}
