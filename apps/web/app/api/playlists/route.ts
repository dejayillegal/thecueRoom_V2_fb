import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { playlists } from '@thecueroom/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const db = getDbClient();

const playlistSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  platform: z.enum(['spotify', 'soundcloud', 'beatport', 'mixcloud', 'bandcamp', 'youtube_music']).default('soundcloud'),
  platformId: z.string().optional(),
  embedUrl: z.string().url(),
  thumbnail: z.string().url().optional(),
  weekOf: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const featured = searchParams.get('featured') === 'true';

    let results;
    if (featured) {
      results = await db
        .select()
        .from(playlists)
        .where(eq(playlists.featured, true))
        .orderBy(desc(playlists.weekOf))
        .limit(limit);
    } else {
      results = await db
        .select()
        .from(playlists)
        .orderBy(desc(playlists.weekOf))
        .limit(limit);
    }

    return NextResponse.json({
      ok: true,
      playlists: results,
    });
  } catch (error) {
    console.error('Playlists GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = playlistSchema.parse(body);

    const [playlist] = await db
      .insert(playlists)
      .values({
        title: data.title,
        description: data.description,
        curatorId: session.uid,
        platform: data.platform,
        platformId: data.platformId,
        embedUrl: data.embedUrl,
        thumbnail: data.thumbnail,
        weekOf: new Date(data.weekOf),
        featured: true,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      playlist,
      message: 'Playlist created successfully',
    });
  } catch (error) {
    console.error('Playlist creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
