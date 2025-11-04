import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { trackSuggestions } from '@thecueroom/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const suggestionSchema = z.object({
  trackPlatform: z.enum(['spotify', 'soundcloud', 'beatport', 'mixcloud', 'bandcamp', 'youtube_music']),
  trackUrl: z.string().url(),
  trackTitle: z.string().min(1).max(200).optional(),
  artistName: z.string().min(1).max(200).optional(),
  notes: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
    const status = searchParams.get('status') || 'pending';

    const db = getDbClient();

    const queryBuilder = db
      .select()
      .from(trackSuggestions)
      .$dynamic();

    let results;
    if (session.role === 'admin') {
      if (status !== 'all') {
        results = await queryBuilder
          .where(eq(trackSuggestions.status, status))
          .orderBy(desc(trackSuggestions.createdAt))
          .limit(limit);
      } else {
        results = await queryBuilder
          .orderBy(desc(trackSuggestions.createdAt))
          .limit(limit);
      }
    } else {
      results = await queryBuilder
        .where(eq(trackSuggestions.artistId, session.uid))
        .orderBy(desc(trackSuggestions.createdAt))
        .limit(limit);
    }

    return NextResponse.json({
      data: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Track suggestions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || (session.role !== 'artist' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Artists and admins only.' }, { status: 403 });
    }

    const body = await request.json();
    const data = suggestionSchema.parse(body);

    const db = getDbClient();

    const [suggestion] = await db
      .insert(trackSuggestions)
      .values({
        artistId: session.uid,
        trackPlatform: data.trackPlatform,
        trackUrl: data.trackUrl,
        trackTitle: data.trackTitle,
        artistName: data.artistName,
        notes: data.notes,
        metadata: data.metadata || {},
        status: 'pending',
      })
      .returning();

    return NextResponse.json({
      ok: true,
      suggestion,
      message: 'Track suggestion submitted successfully',
    });
  } catch (error) {
    console.error('Track suggestion POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to submit suggestion' },
      { status: 500 }
    );
  }
}
