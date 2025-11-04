import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { playlists, users } from '@thecueroom/db/schema';
import { desc, eq, and, or, isNotNull } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'latest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));
    const offset = (page - 1) * limit;

    const session = await getSession();
    const db = getDbClient();

    let whereConditions: any;
    let orderByClause: any;

    switch (scope) {
      case 'latest':
        whereConditions = eq(playlists.status, 'live');
        orderByClause = desc(playlists.curatedAt);
        break;

      case 'featured':
        whereConditions = and(
          eq(playlists.status, 'live'),
          eq(playlists.featured, true)
        );
        orderByClause = desc(playlists.curatedAt);
        break;

      case 'admin':
        if (session?.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        whereConditions = undefined;
        orderByClause = desc(playlists.createdAt);
        break;

      case 'queued':
        if (session?.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        whereConditions = eq(playlists.status, 'queued');
        orderByClause = desc(playlists.createdAt);
        break;

      case 'drafts':
        if (session?.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        whereConditions = eq(playlists.status, 'draft');
        orderByClause = desc(playlists.createdAt);
        break;

      default:
        whereConditions = eq(playlists.status, 'live');
        orderByClause = desc(playlists.curatedAt);
    }

    const queryBuilder = db
      .select({
        id: playlists.id,
        title: playlists.title,
        description: playlists.description,
        platform: playlists.platform,
        platformId: playlists.platformId,
        embedUrl: playlists.embedUrl,
        thumbnail: playlists.thumbnail,
        weekOf: playlists.weekOf,
        curatedAt: playlists.curatedAt,
        status: playlists.status,
        visibility: playlists.visibility,
        autoCurated: playlists.autoCurated,
        aiConfidenceScore: playlists.aiConfidenceScore,
        curatorId: playlists.curatorId,
        curatorName: users.username,
        createdAt: playlists.createdAt,
      })
      .from(playlists)
      .leftJoin(users, eq(playlists.curatorId, users.id))
      .$dynamic();

    const query = whereConditions
      ? queryBuilder.where(whereConditions)
      : queryBuilder;

    const results = await query
      .orderBy(orderByClause)
      .limit(limit + 1)
      .offset(offset);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, -1) : results;

    return NextResponse.json({
      data: items,
      page,
      hasMore,
      total: items.length,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': scope === 'admin' || scope === 'queued' || scope === 'drafts'
          ? 'no-cache, no-store, must-revalidate'
          : 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Playlists list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}
