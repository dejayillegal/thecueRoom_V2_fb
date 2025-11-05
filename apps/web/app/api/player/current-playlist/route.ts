import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { playlists } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient();

    const currentPlaylist = await db
      .select()
      .from(playlists)
      .where(eq(playlists.status, 'live'))
      .orderBy(desc(playlists.curatedAt))
      .limit(1);

    if (!currentPlaylist || currentPlaylist.length === 0) {
      return NextResponse.json({
        ok: true,
        playlist: null,
      });
    }

    const playlist = currentPlaylist[0];

    return NextResponse.json({
      ok: true,
      playlist: {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        embedUrl: playlist.embedUrl,
        externalUrl: playlist.soundcloudUrl,
        platform: playlist.platform,
        platformId: playlist.platformId,
        thumbnail: playlist.thumbnail,
        curatedAt: playlist.curatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Current Playlist API] Error:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch current playlist' },
      { status: 500 }
    );
  }
}
