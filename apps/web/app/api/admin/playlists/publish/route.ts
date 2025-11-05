
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, adminPlaylistsHistory } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { publishPlaylistSchema } from '@thecueroom/shared/adminPlaylistSchemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const data = publishPlaylistSchema.parse(body);

    const db = getDbClient();

    await db.transaction(async (tx) => {
      // Get the playlist to publish
      const [targetPlaylist] = await tx
        .select()
        .from(adminPlaylists)
        .where(eq(adminPlaylists.id, data.adminPlaylistId));

      if (!targetPlaylist) {
        throw new Error('Playlist not found');
      }

      if (data.publishNow) {
        // Archive current live playlist
        const [currentLive] = await tx
          .select()
          .from(adminPlaylists)
          .where(eq(adminPlaylists.status, 'live'));

        if (currentLive) {
          // Save to history
          await tx.insert(adminPlaylistsHistory).values({
            adminPlaylistId: currentLive.id,
            snapshot: currentLive as any,
            action: 'archived',
            createdBy: session.userId,
          });

          // Archive it
          await tx
            .update(adminPlaylists)
            .set({ status: 'archived' })
            .where(eq(adminPlaylists.id, currentLive.id));
        }

        // Publish new playlist
        await tx
          .update(adminPlaylists)
          .set({
            status: 'live',
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(adminPlaylists.id, data.adminPlaylistId));

        // Save to history
        await tx.insert(adminPlaylistsHistory).values({
          adminPlaylistId: data.adminPlaylistId,
          snapshot: { ...targetPlaylist, status: 'live', publishedAt: new Date() } as any,
          action: 'published',
          createdBy: session.userId,
        });
      } else if (data.scheduledAt) {
        // Schedule for later
        await tx
          .update(adminPlaylists)
          .set({
            status: 'queued',
            scheduledAt: new Date(data.scheduledAt),
            updatedAt: new Date(),
          })
          .where(eq(adminPlaylists.id, data.adminPlaylistId));

        await tx.insert(adminPlaylistsHistory).values({
          adminPlaylistId: data.adminPlaylistId,
          snapshot: { ...targetPlaylist, status: 'queued' } as any,
          action: 'scheduled',
          createdBy: session.userId,
        });
      }
    });

    const message = data.publishNow
      ? 'Playlist published successfully'
      : 'Playlist scheduled for publishing';

    return NextResponse.json({
      ok: true,
      message,
    });
  } catch (error) {
    console.error('Publish playlist error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to publish playlist' },
      { status: 500 }
    );
  }
}
