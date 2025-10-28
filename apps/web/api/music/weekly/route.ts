
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    // In TEST_MODE, return mock tracks
    if (process.env.TEST_MODE === 'true') {
      return NextResponse.json({
        tracks: [
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
        ].filter(track => !platform || platform === 'all' || track.platform === platform),
      });
    }

    // In production, aggregate from multiple music platforms
    return NextResponse.json({ tracks: [] });

  } catch (error) {
    console.error('Weekly music error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
