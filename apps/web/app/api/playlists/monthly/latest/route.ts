import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, users } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDbClient();

    const liveEntries = await db
      .select()
      .from(adminPlaylists)
      .where(eq(adminPlaylists.status, 'live'))
      .orderBy(desc(adminPlaylists.publishedAt));

    if (!liveEntries || liveEntries.length === 0) {
      console.log('No live playlists found in database');
      return NextResponse.json(
        { ok: false, error: 'No live playlists found' },
        { status: 404 }
      );
    }

    // Group by platform - ensure platformGroups is always an object
    const platformGroups: Record<string, any> = {};
    for (const entry of liveEntries) {
      const platform = entry.platform || 'unknown';
      if (!platformGroups[platform] || new Date(entry.publishedAt || 0) > new Date(platformGroups[platform].publishedAt || 0)) {
        platformGroups[platform] = entry;
      }
    }

    // Safety check before Object.entries
    if (!platformGroups || typeof platformGroups !== 'object') {
      console.error('platformGroups is not a valid object:', platformGroups);
      return NextResponse.json(
        { ok: false, error: 'Failed to process playlists' },
        { status: 500 }
      );
    }

    const playlists = Object.entries(platformGroups).map(([platform, playlist]) => {
      // Get curator information
      let curatorName = 'thecueRoom';
      const curatorId = playlist.curatorId;

      return {
        id: playlist.id,
        title: playlist.title || 'Untitled Playlist',
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
      playlists,
    });
  } catch (error) {
    console.error('Fetch latest playlists error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}