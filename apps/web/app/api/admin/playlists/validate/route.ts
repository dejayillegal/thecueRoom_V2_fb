
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { validatePlaylistUrlSchema } from '@thecueroom/shared/adminPlaylistSchemas';
import { extractSpotifyPlaylistId, validateSpotifyPlaylist } from '@/lib/spotify-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { url } = validatePlaylistUrlSchema.parse(body);

    const playlistId = extractSpotifyPlaylistId(url);
    if (!playlistId) {
      return NextResponse.json(
        { ok: false, error: 'Could not extract playlist ID from URL' },
        { status: 400 }
      );
    }

    const metadata = await validateSpotifyPlaylist(playlistId);

    return NextResponse.json({
      ok: true,
      metadata,
    });
  } catch (error) {
    console.error('Playlist validation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Failed to validate playlist' },
      { status: 500 }
    );
  }
}
