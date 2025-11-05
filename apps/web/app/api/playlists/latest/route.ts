
import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, users } from '@thecueroom/db/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDbClient();

    const [playlist] = await db
      .select({
        id: adminPlaylists.id,
        title: adminPlaylists.title,
        description: adminPlaylists.description,
        platform: adminPlaylists.platform,
        platformId: adminPlaylists.platformId,
        embedUrl: adminPlaylists.embedUrl,
        coverImage: adminPlaylists.coverImage,
        status: adminPlaylists.status,
        publishedAt: adminPlaylists.publishedAt,
        trackCount: adminPlaylists.trackCount,
        curatorName: users.displayName,
      })
      .from(adminPlaylists)
      .leftJoin(users, eq(adminPlaylists.curatorId, users.id))
      .where(
        and(
          eq(adminPlaylists.status, 'live'),
          isNotNull(adminPlaylists.publishedAt)
        )
      )
      .orderBy(desc(adminPlaylists.publishedAt))
      .limit(1);

    if (!playlist) {
      return NextResponse.json(
        { ok: false, error: 'No live playlist found' },
        { status: 404 }
      );
    }

    // Ensure null values are handled properly
    const safePlaylist = {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description || undefined,
      platform: playlist.platform,
      platformId: playlist.platformId || undefined,
      embedUrl: playlist.embedUrl || undefined,
      coverImage: playlist.coverImage || undefined,
      status: playlist.status,
      publishedAt: playlist.publishedAt || undefined,
      trackCount: playlist.trackCount || 0,
      curatorName: playlist.curatorName || undefined,
    };

    return NextResponse.json({
      ok: true,
      playlist: safePlaylist,
    });
  } catch (error) {
    console.error('Fetch latest playlist error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}
