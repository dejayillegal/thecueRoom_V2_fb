
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists } from '@thecueroom/db/schema';
import { getSession } from '@/lib/auth';
import { createPlaylistSchema } from '@thecueroom/shared/adminPlaylistSchemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const data = createPlaylistSchema.parse(body);

    const db = getDbClient();
    const [playlist] = await db
      .insert(adminPlaylists)
      .values({
        title: data.title,
        description: data.description,
        platform: data.platform,
        platformId: data.platformId,
        embedUrl: data.embedUrl,
        coverImage: data.coverImage,
        trackCount: data.trackCount,
        curatorId: session.userId,
        status: 'draft',
        autoCurated: data.autoCurated,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        metadata: data.metadata || {},
      })
      .returning();

    return NextResponse.json({
      ok: true,
      playlist,
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
