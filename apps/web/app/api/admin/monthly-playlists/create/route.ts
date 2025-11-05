import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { CreatePlaylistInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas'; // Assuming this is the correct schema name based on changes
import { adminPlaylists } from '@thecueroom/db/schema';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.platform || !body.platformId || !body.embedUrl) {
      return NextResponse.json({
        ok: false,
        error: 'Missing required fields: platform, platformId, embedUrl',
      }, { status: 400 });
    }

    const validatedInput = CreatePlaylistInputSchema.safeParse(body);

    if (!validatedInput.success) {
      console.error('Validation errors:', validatedInput.error.issues);
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: validatedInput.error.issues,
      }, { status: 400 });
    }

    const {
      title,
      description,
      platform,
      platformId,
      embedUrl,
      coverImage,
      trackCount,
      monthOf,
      status,
      metadata,
    } = validatedInput.data;

    const db = getDbClient();

    const [playlist] = await db
      .insert(adminPlaylists)
      .values({
        title,
        description: description || null,
        platform,
        platformId,
        embedUrl,
        coverImage: coverImage || null,
        curatorId: session.uid,
        status,
        autoCurated: false,
        monthOf: new Date(monthOf),
        trackCount: trackCount || null,
        metadata: metadata || {},
      })
      .returning();

    return NextResponse.json({
      ok: true,
      playlist,
    });
  } catch (error) {
    console.error('Error creating monthly playlist:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to create playlist',
    }, { status: 500 });
  }
}