
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, description, monthOf } = body;

    const db = getDbClient();

    const [updated] = await db
      .update(adminPlaylists)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(monthOf && { monthOf: new Date(monthOf) }),
        updatedAt: new Date(),
      })
      .where(eq(adminPlaylists.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, playlist: updated });
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = getDbClient();

    await db.delete(adminPlaylists).where(eq(adminPlaylists.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
