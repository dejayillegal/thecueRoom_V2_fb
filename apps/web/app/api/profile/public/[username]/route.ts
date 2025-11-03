
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || 
                         cookieStore.get('auth-token') ||
                         cookieStore.get('user-session');

    if (!sessionCookie) return null;

    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      return session.userId || session.uid || session.id || null;
    } catch {
      const cookieValue = sessionCookie.value;
      if (cookieValue.includes('.')) {
        const parts = cookieValue.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          return payload.uid || payload.userId || payload.id || payload.sub || null;
        }
      }
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cookieValue)) {
        return cookieValue;
      }
    }
  } catch (error) {
    console.error('[Public Profile API] Session error:', error);
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const currentUserId = await getCurrentUserId(request);

    console.log('[Public Profile API] Fetching profile for username:', username);
    const db = getDbClient();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      console.log('[Public Profile API] User not found:', username);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    // Build response based on privacy settings
    const publicProfile = {
      id: user.id,
      username: user.username,
      email: profile?.showEmail ? user.email : undefined,
      verified: user.verified,
      verificationStatus: user.verificationStatus,
      role: user.role,
      profile: {
        displayName: profile?.displayName || null,
        artistName: user.artistName || profile?.artistName || null,
        firstName: profile?.firstName || null,
        lastName: profile?.lastName || null,
        bio: profile?.bio || null,
        avatar: profile?.avatar || null,
        phone: profile?.showPhone ? profile?.phone : undefined,
        region: profile?.region || null,
        genre: profile?.genre || null,
        socialProfileUrl: null, // TODO: Add to schema
        showEmail: profile?.showEmail || false,
        showPhone: profile?.showPhone || false,
        publicReleases: profile?.publicReleases || false,
        allowContactRequests: profile?.allowContactRequests || false,
      },
      stats: {
        followersCount: 0, // TODO: Implement followers system
        gigsCount: 0, // TODO: Count from gigs table
        releasesCount: 0, // TODO: Count from releases table
      },
    };

    // TODO: Check if current user is following this profile
    const isFollowing = false;

    return NextResponse.json({
      user: publicProfile,
      isFollowing,
    });
  } catch (error) {
    console.error('[Public Profile API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
