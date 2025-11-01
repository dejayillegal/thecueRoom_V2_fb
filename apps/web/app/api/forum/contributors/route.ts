
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, userReputation } from '@thecueroom/db/schema';
import { desc, eq } from 'drizzle-orm';

const db = getDbClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const contributors = await db.select({
      userId: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
      verified: users.verified,
      karmaPoints: userReputation.karmaPoints,
      badges: userReputation.badges,
      weeklyRank: userReputation.weeklyRank,
    })
    .from(userReputation)
    .leftJoin(users, eq(userReputation.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .orderBy(desc(userReputation.karmaPoints))
    .limit(limit);

    return NextResponse.json({ contributors });
  } catch (error) {
    console.error('List contributors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributors' },
      { status: 500 }
    );
  }
}
