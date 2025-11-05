import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { ListPlaylistsQuerySchema } from '@thecueroom/shared/monthlyPlaylistSchemas';
import { adminPlaylists } from '@thecueroom/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = ListPlaylistsQuerySchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid query parameters',
        details: validatedQuery.error.issues,
      }, { status: 400 });
    }

    const { status, platform, autoCurated, limit, offset } = validatedQuery.data;

    const db = await getDbClient();
    
    const conditions = [];
    if (status) {
      conditions.push(eq(adminPlaylists.status, status));
    }
    if (platform) {
      conditions.push(eq(adminPlaylists.platform, platform));
    }
    if (autoCurated !== undefined) {
      conditions.push(eq(adminPlaylists.autoCurated, autoCurated === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const playlists = await db
      .select()
      .from(adminPlaylists)
      .where(whereClause)
      .orderBy(desc(adminPlaylists.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: adminPlaylists.id })
      .from(adminPlaylists)
      .where(whereClause);

    return NextResponse.json({
      ok: true,
      playlists,
      pagination: {
        limit,
        offset,
        total: total.length,
        hasMore: offset + limit < total.length,
      },
    });
  } catch (error) {
    console.error('Error listing monthly playlists:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to list playlists',
    }, { status: 500 });
  }
}
