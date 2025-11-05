
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, adminPlaylistsHistory, users } from '@thecueroom/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';

    const db = getDbClient();

    const playlistsList = await db
      .select({
        id: adminPlaylists.id,
        title: adminPlaylists.title,
        description: adminPlaylists.description,
        platform: adminPlaylists.platform,
        platformId: adminPlaylists.platformId,
        embedUrl: adminPlaylists.embedUrl,
        coverImage: adminPlaylists.coverImage,
        status: adminPlaylists.status,
        autoCurated: adminPlaylists.autoCurated,
        scheduledAt: adminPlaylists.scheduledAt,
        publishedAt: adminPlaylists.publishedAt,
        trackCount: adminPlaylists.trackCount,
        createdAt: adminPlaylists.createdAt,
        curatorName: users.displayName,
      })
      .from(adminPlaylists)
      .leftJoin(users, eq(adminPlaylists.curatorId, users.id))
      .orderBy(desc(adminPlaylists.createdAt));

    let history = [];
    if (includeHistory) {
      history = await db
        .select()
        .from(adminPlaylistsHistory)
        .orderBy(desc(adminPlaylistsHistory.createdAt))
        .limit(50);
    }

    return NextResponse.json({
      ok: true,
      playlists: playlistsList,
      history: includeHistory ? history : undefined,
    });
  } catch (error) {
    console.error('List playlists error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}
