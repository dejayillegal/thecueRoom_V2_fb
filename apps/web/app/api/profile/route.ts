import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse session to get user ID
    let userId: string;
    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      userId = session.userId || session.uid;
    } catch (parseError) {
      // If JSON parse fails, try to extract from plain text
      const sessionValue = decodeURIComponent(sessionCookie.value);
      const uidMatch = sessionValue.match(/uid[:"']([^"',}]+)/);
      const userIdMatch = sessionValue.match(/userId[:"']([^"',}]+)/);
      userId = uidMatch?.[1] || userIdMatch?.[1] || '';
    }

    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const db = getDbClient();

    // Fetch user and profile data
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
        role: user.role,
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      userId = session.userId || session.uid;
    } catch (parseError) {
      const sessionValue = decodeURIComponent(sessionCookie.value);
      const uidMatch = sessionValue.match(/uid[:"']([^"',}]+)/);
      const userIdMatch = sessionValue.match(/userId[:"']([^"',}]+)/);
      userId = uidMatch?.[1] || userIdMatch?.[1] || '';
    }

    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDbClient();

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allowed fields for update (excluding username, email, artistName, verified social links)
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
      allowContactRequests: body.allowContactRequests,
    };

    // Remove undefined fields
    const updateData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
    );

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.userId, userId));
    } else {
      // Create new profile
      await db.insert(profiles).values({
        userId,
        ...updateData,
      });
    }

    // Fetch updated profile
    const [updatedProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
