
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { toggleAutoCurationSchema } from '@thecueroom/shared/adminPlaylistSchemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled } = toggleAutoCurationSchema.parse(body);

    const db = getDbClient();

    // Get current live playlist
    const [currentLive] = await db
      .select()
      .from(adminPlaylists)
      .where(eq(adminPlaylists.status, 'live'));

    if (currentLive) {
      await db
        .update(adminPlaylists)
        .set({
          autoCurated: enabled,
          updatedAt: new Date(),
        })
        .where(eq(adminPlaylists.id, currentLive.id));
    }

    return NextResponse.json({
      ok: true,
      message: enabled
        ? 'Auto-curation enabled for next cycle'
        : 'Auto-curation disabled - manual control active',
      autoCurated: enabled,
    });
  } catch (error) {
    console.error('Toggle auto-curation error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to toggle auto-curation' },
      { status: 500 }
    );
  }
}
