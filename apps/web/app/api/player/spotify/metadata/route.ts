
import { NextResponse } from 'next/server';
import { validateSpotifyPlaylist } from '@/lib/spotify-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');

    if (!playlistId) {
      return NextResponse.json(
        { ok: false, error: 'playlistId is required' },
        { status: 400 }
      );
    }

    // Use existing Spotify validation function to get metadata
    const metadata = await validateSpotifyPlaylist(playlistId);

    return NextResponse.json({
      ok: true,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        coverImage: metadata.coverImage,
        trackCount: metadata.trackCount,
        platformId: metadata.platformId,
        embedUrl: metadata.embedUrl,
        owner: metadata.owner,
      },
    });
  } catch (error) {
    console.error('Spotify metadata fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metadata';
    
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
