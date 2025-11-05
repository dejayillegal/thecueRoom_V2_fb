import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { SchedulePlaylistInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas';
import { adminPlaylists } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedInput = SchedulePlaylistInputSchema.safeParse(body);
    
    if (!validatedInput.success) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: validatedInput.error.issues,
      }, { status: 400 });
    }

    const { id, scheduledAt } = validatedInput.data;

    const db = await getDbClient();

    const [playlist] = await db
      .select()
      .from(adminPlaylists)
      .where(eq(adminPlaylists.id, id))
      .limit(1);

    if (!playlist) {
      return NextResponse.json({
        ok: false,
        error: 'Playlist not found',
      }, { status: 404 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({
        ok: false,
        error: 'Scheduled date must be in the future',
      }, { status: 400 });
    }

    const [updatedPlaylist] = await db
      .update(adminPlaylists)
      .set({
        status: 'scheduled',
        scheduledAt: scheduledDate,
        updatedAt: new Date(),
      })
      .where(eq(adminPlaylists.id, id))
      .returning();

    return NextResponse.json({
      ok: true,
      playlist: updatedPlaylist,
    });
  } catch (error) {
    console.error('Error scheduling monthly playlist:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to schedule playlist',
    }, { status: 500 });
  }
}
