
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MOCK_TRACKS = [
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
  {
    id: '5',
    title: 'Acid Dreams',
    artist: 'Phuture Collective',
    platform: 'bandcamp',
    url: 'https://bandcamp.com/track/acid',
    imageUrl: 'https://picsum.photos/seed/track5/400/400',
    tags: ['acid', 'techno'],
  },
  {
    id: '6',
    title: 'Minimal Space',
    artist: 'Echospace',
    platform: 'soundcloud',
    url: 'https://soundcloud.com/track/minimal',
    imageUrl: 'https://picsum.photos/seed/track6/400/400',
    tags: ['minimal', 'dub'],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    const filteredTracks = !platform || platform === 'all' 
      ? MOCK_TRACKS 
      : MOCK_TRACKS.filter(track => track.platform === platform);

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
