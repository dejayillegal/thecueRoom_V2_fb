
import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, users } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDbClient();

    const livePlaylists = await db
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
        monthOf: adminPlaylists.monthOf,
        trackCount: adminPlaylists.trackCount,
        curatorId: adminPlaylists.curatorId,
        displayName: users.displayName,
        username: users.username,
      })
      .from(adminPlaylists)
      .leftJoin(users, eq(adminPlaylists.curatorId, users.id))
      .where(eq(adminPlaylists.status, 'live'))
      .orderBy(desc(adminPlaylists.publishedAt));

    if (!livePlaylists || livePlaylists.length === 0) {
      console.log('No live playlists found in database');
      return NextResponse.json(
        { ok: false, error: 'No live playlists found' },
        { status: 404 }
      );
    }

    // Transform playlists
    const transformedPlaylists = livePlaylists.map((playlist) => {
      let curatorName = 'thecueRoom';
      if (playlist.displayName) {
        curatorName = playlist.displayName;
      } else if (playlist.username) {
        curatorName = playlist.username;
      }

      return {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description || undefined,
        platform: playlist.platform,
        platformId: playlist.platformId || undefined,
        embedUrl: playlist.embedUrl || undefined,
        coverImage: playlist.coverImage || undefined,
        status: playlist.status,
        publishedAt: playlist.publishedAt || undefined,
        monthOf: playlist.monthOf || undefined,
        trackCount: playlist.trackCount || 0,
        curatorName,
      };
    });

    return NextResponse.json({
      ok: true,
      playlists: transformedPlaylists,
    });
  } catch (error) {
    console.error('Fetch latest playlists error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}
