
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { mentionResolveSchema } from '@thecueroom/shared/forumSchemas';
import { eq, or, ilike, desc } from 'drizzle-orm';

const db = getDbClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const verifiedOnly = searchParams.get('verified_only') === 'true';

    const data = mentionResolveSchema.parse({ q: query, limit, verified_only: verifiedOnly });

    if (!data.q || data.q.length < 1) {
      return NextResponse.json({ users: [] });
    }

    // Search users by username or display name
    const searchPattern = `%${data.q}%`;
    
    let queryBuilder = db
      .select({
        userId: users.id,
        username: users.username,
        displayName: profiles.displayName,
        avatar: profiles.avatar,
        verified: users.verified,
        role: users.role,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(
        or(
          ilike(users.username, searchPattern),
          ilike(profiles.displayName, searchPattern)
        )
      )
      .limit(data.limit);

    // Filter by verified if requested
    if (data.verified_only) {
      queryBuilder = queryBuilder.where(eq(users.verified, true));
    }

    // Prioritize verified artists
    const results = await queryBuilder.orderBy(
      desc(users.verified),
      users.username
    );

    return NextResponse.json({
      users: results.map(u => ({
        userId: u.userId,
        username: u.username,
        displayName: u.displayName || u.username,
        avatar: u.avatar,
        verified: u.verified,
        isModerator: u.role === 'admin',
      })),
    });
  } catch (error) {
    console.error('Mention resolve error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve mentions' },
      { status: 500 }
    );
  }
}
