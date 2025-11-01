
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) return null;
    
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    return session.userId || session.uid || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = getDbClient();
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        verified: user.verified,
        verificationStatus: user.verificationStatus,
        role: user.role
      },
      profile: profile ? {
        displayName: profile.displayName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        avatar: profile.avatar,
        phone: profile.phone,
        region: profile.region,
        genre: profile.genre,
        socialLinks: profile.socialLinks,
        socialProfileUrl: profile.socialProfileUrl,
        showEmail: profile.showEmail,
        showPhone: profile.showPhone,
        publicReleases: profile.publicReleases,
        allowContactRequests: profile.allowContactRequests,
        aiCredits: profile.aiCredits
      } : null
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const db = getDbClient();
    
    // Only allow updating specific fields
    const allowedFields = {
      displayName: body.displayName,
      firstName: body.firstName,
      lastName: body.lastName,
      bio: body.bio,
      avatar: body.avatar,
      phone: body.phone,
      region: body.region,
      genre: body.genre,
      showEmail: body.showEmail,
      showPhone: body.showPhone,
      publicReleases: body.publicReleases,
      allowContactRequests: body.allowContactRequests
    };
    
    // Remove undefined
    const updateData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
    );
    
    updateData.updatedAt = new Date();
    
    await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, userId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
