
import { NextResponse } from 'next/server';
import { extractSpotifyPlaylistId } from '@/lib/spotify-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'url is required' },
        { status: 400 }
      );
    }

    // Detect platform and extract ID
    let platform: string | null = null;
    let playlistId: string | null = null;
    let embedUrl: string | null = null;

    // Spotify
    if (url.includes('spotify.com')) {
      platform = 'spotify';
      playlistId = extractSpotifyPlaylistId(url);
      if (playlistId) {
        embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
      }
    }
    // SoundCloud
    else if (url.includes('soundcloud.com')) {
      platform = 'soundcloud';
      const match = url.match(/soundcloud\.com\/([^\/]+\/[^\/\?]+)/);
      if (match) {
        playlistId = match[1];
        embedUrl = `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${playlistId}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
      }
    }
    // Mixcloud
    else if (url.includes('mixcloud.com')) {
      platform = 'mixcloud';
      const match = url.match(/mixcloud\.com\/([^\/]+\/[^\/\?]+)/);
      if (match) {
        playlistId = match[1];
        embedUrl = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(`/${playlistId}/`)}`;
      }
    }

    if (!platform || !playlistId) {
      return NextResponse.json(
        { ok: false, error: 'Unsupported URL or invalid format' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      platform,
      playlistId,
      embedUrl,
    });
  } catch (error) {
    console.error('URL validation error:', error);
    return NextResponse.json(
      { ok: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
