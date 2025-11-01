
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const db = getDbClient();
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);
    
    // Return ONLY public fields - privacy-safe
    const publicProfile = {
      username: user.username,
      displayName: profile?.displayName || user.username,
      artistName: profile?.artistName,
      bio: profile?.bio, // public bio only
      avatar: profile?.avatar,
      region: profile?.region,
      genre: profile?.genre,
      verified: user.verified,
      verificationStatus: user.verificationStatus,
      // Only include social links if user opted in
      links: profile?.showEmail || profile?.showPhone 
        ? {
            ...(profile?.showEmail && profile?.socialProfileUrl ? { social: profile.socialProfileUrl } : {})
          }
        : undefined,
      // Only show public releases if user opted in
      releases: profile?.publicReleases ? [] : undefined, // TODO: fetch actual releases
      eventsPublic: [], // TODO: fetch public events
      joinedAt: user.createdAt
    };
    
    // Remove undefined fields
    const cleanProfile = Object.fromEntries(
      Object.entries(publicProfile).filter(([_, v]) => v !== undefined)
    );
    
    return NextResponse.json({
      profile: cleanProfile
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
