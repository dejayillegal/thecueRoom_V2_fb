import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { playlists, playlistItems, playlistHistory } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const approveSchema = z.object({
  id: z.string().uuid(),
  publish: z.boolean(),
  scheduleAt: z.string().datetime().optional(),
  changeNotes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const data = approveSchema.parse(body);

    const db = getDbClient();

    const [existingPlaylist] = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, data.id));

    if (!existingPlaylist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const existingItems = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, data.id));

    await db.transaction(async (tx) => {
      await tx
        .insert(playlistHistory)
        .values({
          playlistId: data.id,
          snapshotData: {
            playlist: existingPlaylist,
            items: existingItems,
          },
          changedBy: session.uid,
          changeType: data.publish ? 'published' : 'archived',
          changeNotes: data.changeNotes || (data.publish ? 'Approved and published' : 'Archived'),
        });

      if (data.publish) {
        const updateData: any = {
          status: 'live',
          curatedAt: new Date(),
        };

        if (data.scheduleAt) {
          updateData.scheduledPublishAt = new Date(data.scheduleAt);
          updateData.status = 'queued';
        }

        await tx
          .update(playlists)
          .set(updateData)
          .where(eq(playlists.id, data.id));
      } else {
        await tx
          .update(playlists)
          .set({
            status: 'archived',
          })
          .where(eq(playlists.id, data.id));
      }
    });

    return NextResponse.json({
      ok: true,
      message: data.publish 
        ? (data.scheduleAt ? 'Playlist scheduled for publishing' : 'Playlist published successfully')
        : 'Playlist archived',
    });
  } catch (error) {
    console.error('Playlist approve error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to approve playlist' },
      { status: 500 }
    );
  }
}
