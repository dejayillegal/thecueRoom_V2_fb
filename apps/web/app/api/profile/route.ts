import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Helper function to extract userId from session cookie
async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    // Try multiple cookie names
    const sessionCookie = cookieStore.get('session') ||
                         cookieStore.get('auth-token') ||
                         cookieStore.get('user-session') ||
                         cookieStore.get('__session');

    if (!sessionCookie) {
      console.log('[Profile API] No session cookie found. Available cookies:', cookieStore.getAll().map(c => c.name));
      return null;
    }

    console.log('[Profile API] Found session cookie:', sessionCookie.name);

    try {
      // First try to parse as JSON
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      const userId = session.userId || session.uid || session.id || null;
      console.log('[Profile API] Extracted userId from JSON session:', userId ? 'found' : 'not found');
      return userId;
    } catch (parseError) {
      // If not JSON, check if it's a JWT token
      const cookieValue = sessionCookie.value;
      
      if (cookieValue.includes('.')) {
        // Looks like a JWT token, decode it
        try {
          const parts = cookieValue.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            const userId = payload.uid || payload.userId || payload.id || payload.sub || null;
            console.log('[Profile API] Extracted userId from JWT:', userId ? 'found' : 'not found');
            return userId;
          }
        } catch (jwtError) {
          console.error('[Profile API] Failed to decode JWT:', jwtError);
        }
      }
      
      // Last resort: treat as raw userId (UUID format check)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cookieValue)) {
        console.log('[Profile API] Using raw value as userId (valid UUID)');
        return cookieValue;
      }
      
      console.log('[Profile API] Could not extract userId from cookie');
      return null;
    }
  } catch (error) {
    console.error('[Profile API] Session retrieval error:', error);
    return null;
  }
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);

    if (!userId) {
      console.log('[Profile API] No userId found in session');
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 });
    }

    console.log('[Profile API] Fetching profile for userId:', userId);
    const db = getDbClient();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId as any))
      .limit(1);

    if (!user) {
      console.log('[Profile API] User not found in database for userId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Profile API] User found:', user.username);

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId as any))
      .limit(1);

    return NextResponse.json({
      user,
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
    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDbClient();

    // Allowed fields for update
    const updateData: any = {
      displayName: body.displayName,
      artistName: body.artistName,
      firstName: body.firstName,
      lastName: body.lastName,
      bio: body.bio,
      phone: body.phone,
      region: body.region,
      genre: body.genre,
      showEmail: body.showEmail,
      showPhone: body.showPhone,
      publicReleases: body.publicReleases,
      allowContactRequests: body.allowContactRequests,
      socialLinks: body.socialLinks || body.socialLinksData,
      avatarSeed: body.avatarSeed,
      avatarType: body.avatarType,
      updatedAt: new Date(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId as any))
      .limit(1);

    if (existingProfile) {
      await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.userId, userId as any));
    } else {
      await db.insert(profiles).values({
        userId: userId as any,
        ...updateData,
      });
    }

    // Fetch updated profile
    const [updatedProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId as any))
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