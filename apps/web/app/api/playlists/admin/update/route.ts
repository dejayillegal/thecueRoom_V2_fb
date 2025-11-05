import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { playlists, playlistItems, playlistHistory } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const playlistItemSchema = z.object({
  id: z.string().uuid().optional(),
  trackPlatform: z.string(),
  trackId: z.string(),
  trackTitle: z.string(),
  artistName: z.string(),
  trackUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  position: z.number().int().min(0),
  aiScore: z.number().int().min(0).max(100).optional(),
  aiRationale: z.string().optional(),
});

const updatePlaylistSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  platform: z.enum(['spotify', 'soundcloud', 'beatport', 'mixcloud', 'bandcamp', 'youtube_music']),
  platformId: z.string().optional().nullable(),
  embedUrl: z.string().url().optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  visibility: z.enum(['admin', 'featured', 'public']).default('public'),
  items: z.array(playlistItemSchema),
  metadata: z.record(z.any()).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const data = updatePlaylistSchema.parse(body);

    const db = getDbClient();
    
    await db.transaction(async (tx) => {
      let playlistId = data.id;
      let existingPlaylist = null;
      let existingItems: any[] = [];

      if (playlistId) {
        [existingPlaylist] = await tx
          .select()
          .from(playlists)
          .where(eq(playlists.id, playlistId));

        if (!existingPlaylist) {
          throw new Error('Playlist not found');
        }

        existingItems = await tx
          .select()
          .from(playlistItems)
          .where(eq(playlistItems.playlistId, playlistId));

        await tx
          .insert(playlistHistory)
          .values({
            playlistId,
            snapshotData: {
              playlist: existingPlaylist,
              items: existingItems,
            },
            changedBy: session.uid,
            changeType: 'updated',
            changeNotes: 'Manual edit via admin panel',
          });

        await tx
          .update(playlists)
          .set({
            title: data.title,
            description: data.description,
            platform: data.platform,
            platformId: data.platformId,
            embedUrl: data.embedUrl,
            thumbnail: data.thumbnail,
            visibility: data.visibility,
            metadata: data.metadata,
          })
          .where(eq(playlists.id, playlistId));

        await tx.delete(playlistItems).where(eq(playlistItems.playlistId, playlistId));
      } else {
        const [newPlaylist] = await tx
          .insert(playlists)
          .values({
            title: data.title,
            description: data.description,
            curatorId: session.uid,
            platform: data.platform,
            platformId: data.platformId,
            embedUrl: data.embedUrl,
            thumbnail: data.thumbnail,
            weekOf: new Date(),
            visibility: data.visibility,
            status: 'draft',
            autoCurated: false,
            metadata: data.metadata,
          })
          .returning();

        playlistId = newPlaylist.id;

        await tx
          .insert(playlistHistory)
          .values({
            playlistId,
            snapshotData: {
              playlist: newPlaylist,
              items: [],
            },
            changedBy: session.uid,
            changeType: 'created',
            changeNotes: 'Created via admin panel',
          });
      }

      if (data.items && data.items.length > 0) {
        await tx.insert(playlistItems).values(
          data.items.map((item) => ({
            playlistId,
            trackPlatform: item.trackPlatform,
            trackId: item.trackId,
            trackTitle: item.trackTitle,
            artistName: item.artistName,
            trackUrl: item.trackUrl,
            previewUrl: item.previewUrl,
            coverImage: item.coverImage,
            metadata: item.metadata || {},
            position: item.position,
            aiScore: item.aiScore,
            aiRationale: item.aiRationale,
            addedBy: session.uid,
          }))
        );
      }
    });

    return NextResponse.json({
      ok: true,
      message: data.id ? 'Playlist updated successfully' : 'Playlist created successfully',
    });
  } catch (error) {
    console.error('Playlist update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}
