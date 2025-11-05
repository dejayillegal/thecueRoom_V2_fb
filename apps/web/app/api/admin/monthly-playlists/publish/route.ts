import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { PublishPlaylistInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas';
import { adminPlaylists, adminPlaylistsHistory } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedInput = PublishPlaylistInputSchema.safeParse(body);
    
    if (!validatedInput.success) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: validatedInput.error.issues,
      }, { status: 400 });
    }

    const { id, archivePrevious = true } = validatedInput.data;

    const db = await getDbClient();

    const [playlistToPublish] = await db
      .select()
      .from(adminPlaylists)
      .where(eq(adminPlaylists.id, id))
      .limit(1);

    if (!playlistToPublish) {
      return NextResponse.json({
        ok: false,
        error: 'Playlist not found',
      }, { status: 404 });
    }

    if (playlistToPublish.status === 'live') {
      return NextResponse.json({
        ok: false,
        error: 'Playlist is already live',
      }, { status: 400 });
    }

    if (archivePrevious) {
      const currentLive = await db
        .select()
        .from(adminPlaylists)
        .where(eq(adminPlaylists.status, 'live'));

      for (const livePlaylist of currentLive) {
        await db
          .insert(adminPlaylistsHistory)
          .values({
            adminPlaylistId: livePlaylist.id,
            snapshotData: livePlaylist,
            changeType: 'archived',
            changedBy: session.uid,
            changeNotes: `Archived to make room for new monthly playlist: ${playlistToPublish.title}`,
          });

        await db
          .update(adminPlaylists)
          .set({ status: 'archived', updatedAt: new Date() })
          .where(eq(adminPlaylists.id, livePlaylist.id));
      }
    }

    await db
      .insert(adminPlaylistsHistory)
      .values({
        adminPlaylistId: id,
        snapshotData: playlistToPublish,
        changeType: 'published',
        changedBy: session.uid,
        changeNotes: 'Published as live monthly playlist',
      });

    const [updatedPlaylist] = await db
      .update(adminPlaylists)
      .set({
        status: 'live',
        publishedAt: new Date(),
        publishedBy: session.uid,
        updatedAt: new Date(),
      })
      .where(eq(adminPlaylists.id, id))
      .returning();

    return NextResponse.json({
      ok: true,
      playlist: updatedPlaylist,
    });
  } catch (error) {
    console.error('Error publishing monthly playlist:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to publish playlist',
    }, { status: 500 });
  }
}
