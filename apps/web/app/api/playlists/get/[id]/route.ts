import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { playlists, playlistItems, users } from '@thecueroom/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    const session = await getSession();
    const db = getDbClient();

    const [playlist] = await db
      .select({
        id: playlists.id,
        title: playlists.title,
        description: playlists.description,
        platform: playlists.platform,
        platformId: playlists.platformId,
        embedUrl: playlists.embedUrl,
        soundcloudUrl: playlists.soundcloudUrl,
        embedHtml: playlists.embedHtml,
        thumbnail: playlists.thumbnail,
        weekOf: playlists.weekOf,
        featured: playlists.featured,
        visibility: playlists.visibility,
        autoCurated: playlists.autoCurated,
        curatedAt: playlists.curatedAt,
        status: playlists.status,
        scheduledPublishAt: playlists.scheduledPublishAt,
        aiConfidenceScore: playlists.aiConfidenceScore,
        metadata: playlists.metadata,
        curatorId: playlists.curatorId,
        curatorName: users.username,
        createdAt: playlists.createdAt,
      })
      .from(playlists)
      .leftJoin(users, eq(playlists.curatorId, users.id))
      .where(eq(playlists.id, id));

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (playlist.status !== 'live' && session?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const items = await db
      .select({
        id: playlistItems.id,
        trackPlatform: playlistItems.trackPlatform,
        trackId: playlistItems.trackId,
        trackTitle: playlistItems.trackTitle,
        artistName: playlistItems.artistName,
        trackUrl: playlistItems.trackUrl,
        previewUrl: playlistItems.previewUrl,
        coverImage: playlistItems.coverImage,
        metadata: playlistItems.metadata,
        position: playlistItems.position,
        aiScore: playlistItems.aiScore,
        aiRationale: playlistItems.aiRationale,
        addedBy: playlistItems.addedBy,
        addedAt: playlistItems.addedAt,
      })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, id))
      .orderBy(playlistItems.position);

    return NextResponse.json({
      playlist: {
        ...playlist,
        items,
        itemsCount: items.length,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': playlist.status === 'live'
          ? 'public, s-maxage=120, stale-while-revalidate=240'
          : 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Playlist get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}
