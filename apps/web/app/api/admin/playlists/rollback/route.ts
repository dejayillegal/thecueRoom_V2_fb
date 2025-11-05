
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, adminPlaylistsHistory } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { rollbackPlaylistSchema } from '@thecueroom/shared/adminPlaylistSchemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const data = rollbackPlaylistSchema.parse(body);

    const db = getDbClient();

    await db.transaction(async (tx) => {
      // Get the history snapshot
      const [historyRecord] = await tx
        .select()
        .from(adminPlaylistsHistory)
        .where(eq(adminPlaylistsHistory.id, data.historyId));

      if (!historyRecord) {
        throw new Error('History record not found');
      }

      const snapshot = historyRecord.snapshot as any;

      // Archive current live playlist
      const [currentLive] = await tx
        .select()
        .from(adminPlaylists)
        .where(eq(adminPlaylists.status, 'live'));

      if (currentLive) {
        await tx.insert(adminPlaylistsHistory).values({
          adminPlaylistId: currentLive.id,
          snapshot: currentLive as any,
          action: 'archived_for_rollback',
          createdBy: session.userId,
        });

        await tx
          .update(adminPlaylists)
          .set({ status: 'archived' })
          .where(eq(adminPlaylists.id, currentLive.id));
      }

      // Restore snapshot as live
      await tx
        .update(adminPlaylists)
        .set({
          status: 'live',
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(adminPlaylists.id, snapshot.id));

      // Record rollback action
      await tx.insert(adminPlaylistsHistory).values({
        adminPlaylistId: snapshot.id,
        snapshot: { ...snapshot, status: 'live' },
        action: 'rollback',
        createdBy: session.userId,
      });
    });

    return NextResponse.json({
      ok: true,
      message: 'Playlist rolled back successfully',
    });
  } catch (error) {
    console.error('Rollback playlist error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to rollback playlist' },
      { status: 500 }
    );
  }
}
