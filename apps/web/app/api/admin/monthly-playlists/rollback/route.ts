import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { RollbackPlaylistInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas';
import { adminPlaylists, adminPlaylistsHistory } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedInput = RollbackPlaylistInputSchema.safeParse(body);
    
    if (!validatedInput.success) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: validatedInput.error.issues,
      }, { status: 400 });
    }

    const { id, toHistoryId, reason } = validatedInput.data;

    const db = await getDbClient();

    const [currentPlaylist] = await db
      .select()
      .from(adminPlaylists)
      .where(eq(adminPlaylists.id, id))
      .limit(1);

    if (!currentPlaylist) {
      return NextResponse.json({
        ok: false,
        error: 'Playlist not found',
      }, { status: 404 });
    }

    const [historyRecord] = await db
      .select()
      .from(adminPlaylistsHistory)
      .where(eq(adminPlaylistsHistory.id, toHistoryId))
      .limit(1);

    if (!historyRecord) {
      return NextResponse.json({
        ok: false,
        error: 'History record not found',
      }, { status: 404 });
    }

    if (historyRecord.adminPlaylistId !== id) {
      return NextResponse.json({
        ok: false,
        error: 'History record does not belong to this playlist',
      }, { status: 400 });
    }

    await db
      .insert(adminPlaylistsHistory)
      .values({
        adminPlaylistId: id,
        snapshotData: currentPlaylist,
        changeType: 'rolled_back',
        changedBy: session.uid,
        changeNotes: reason || `Rolled back to version from ${historyRecord.createdAt}`,
      });

    const snapshotData = historyRecord.snapshotData as any;
    const [rolledBackPlaylist] = await db
      .update(adminPlaylists)
      .set({
        title: snapshotData.title,
        description: snapshotData.description,
        platform: snapshotData.platform,
        platformId: snapshotData.platformId,
        embedUrl: snapshotData.embedUrl,
        coverImage: snapshotData.coverImage,
        status: snapshotData.status,
        monthOf: snapshotData.monthOf,
        trackCount: snapshotData.trackCount,
        metadata: snapshotData.metadata || {},
        updatedAt: new Date(),
      })
      .where(eq(adminPlaylists.id, id))
      .returning();

    return NextResponse.json({
      ok: true,
      playlist: rolledBackPlaylist,
      message: 'Playlist successfully rolled back',
    });
  } catch (error) {
    console.error('Error rolling back playlist:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to rollback playlist',
    }, { status: 500 });
  }
}
