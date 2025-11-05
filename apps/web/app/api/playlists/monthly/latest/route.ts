import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, users } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const db = await getDbClient();
    
    const [latestPlaylist] = await db
      .select({
        id: adminPlaylists.id,
        title: adminPlaylists.title,
        description: adminPlaylists.description,
        platform: adminPlaylists.platform,
        platformId: adminPlaylists.platformId,
        embedUrl: adminPlaylists.embedUrl,
        coverImage: adminPlaylists.coverImage,
        monthOf: adminPlaylists.monthOf,
        publishedAt: adminPlaylists.publishedAt,
        trackCount: adminPlaylists.trackCount,
        status: adminPlaylists.status,
        autoCurated: adminPlaylists.autoCurated,
        curatorId: adminPlaylists.curatorId,
      })
      .from(adminPlaylists)
      .where(eq(adminPlaylists.status, 'live'))
      .orderBy(desc(adminPlaylists.publishedAt))
      .limit(1);

    if (!latestPlaylist) {
      return NextResponse.json({
        ok: true,
        playlist: null,
        message: 'No live monthly playlist available',
      });
    }

    let curatorName = 'thecueRoom';
    if (latestPlaylist.curatorId) {
      const [curator] = await db
        .select({ username: users.username, email: users.email })
        .from(users)
        .where(eq(users.id, latestPlaylist.curatorId))
        .limit(1);
      
      if (curator) {
        curatorName = curator.username || curator.email.split('@')[0];
      }
    }

    return NextResponse.json({
      ok: true,
      playlist: {
        ...latestPlaylist,
        curatorName,
      },
    });
  } catch (error) {
    console.error('Error fetching latest monthly playlist:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch latest monthly playlist',
    }, { status: 500 });
  }
}
