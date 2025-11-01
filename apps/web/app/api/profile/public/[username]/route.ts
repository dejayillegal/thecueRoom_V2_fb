import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const db = getDbClient();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const publicProfile = {
      username: user.username,
      displayName: profile?.displayName,
      artistName: profile?.artistName,
      bio: profile?.bio,
      avatar: profile?.avatar,
      region: profile?.region,
      genre: profile?.genre,
      verified: user.verified,
      email: profile?.showEmail ? user.email : undefined,
      phone: profile?.showPhone ? profile.phone : undefined,
      socialProfileUrl: profile?.socialProfileUrl,
      allowContactRequests: profile?.allowContactRequests ?? true,
      publicReleases: profile?.publicReleases ?? true,
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error('Public profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
