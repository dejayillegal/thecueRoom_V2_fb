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
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      const userId = session.userId || session.uid || session.id || null;
      console.log('[Profile API] Extracted userId from session:', userId ? 'found' : 'not found');
      return userId;
    } catch (parseError) {
      // If not JSON, might be just the user ID
      console.log('[Profile API] Session is not JSON, using raw value as userId');
      return sessionCookie.value;
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

    // Fetch user and profile data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.log('[Profile API] User not found in database for userId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Profile API] User found:', user.username);

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    // Admin script user information
    const adminInfo = {
      username: 'illegal.mastercue',
      email: 'dejayillegal@gmail.com',
      artistName: 'Illegal',
      displayName: 'Illegal Mastercue',
      verificationStatus: 'Approved',
      accountRole: 'Admin',
      owner: true,
    };

    // If the logged-in user is an admin, merge or override with admin info
    let finalUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      verified: user.verified,
      verificationStatus: user.verificationStatus,
      role: user.role,
    };

    if (user.role === 'Admin') {
      finalUser = { ...finalUser, ...adminInfo };
    }

    return NextResponse.json({
      user: finalUser,
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

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent non-admins from updating admin-specific fields
    if (user.role !== 'Admin' && (body.username || body.email || body.artistName || body.displayName || body.verificationStatus || body.accountRole || body.owner)) {
       // Allow updating some fields like displayName for non-admins if desired,
       // but strictly control sensitive admin fields.
       // For now, we'll just return an error for any attempt to update admin fields by non-admins.
       const adminFieldsAttempted = Object.keys(body).some(key => ['username', 'email', 'artistName', 'displayName', 'verificationStatus', 'accountRole', 'owner'].includes(key));
       if (adminFieldsAttempted) {
         return NextResponse.json({ error: 'Unauthorized to update admin fields' }, { status: 403 });
       }
    }


    // Allowed fields for update
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
      // Add other fields from user schema if they should be editable via profile update
      username: body.username, // Allow username update if admin
      email: body.email, // Allow email update if admin
      artistName: body.artistName, // Allow artistName update if admin
      verificationStatus: body.verificationStatus, // Allow verificationStatus update if admin
      role: body.role, // Allow role update if admin
    };

    // Remove undefined fields
    const updateData: Record<string, any> = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
    );

    // Admin specific updates
    if (user.role === 'Admin') {
      if (body.username !== undefined) updateData.username = body.username;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.artistName !== undefined) updateData.artistName = body.artistName;
      if (body.displayName !== undefined) updateData.displayName = body.displayName;
      if (body.verificationStatus !== undefined) updateData.verificationStatus = body.verificationStatus;
      if (body.role !== undefined) updateData.role = body.role; // This would be the user's role
      if (body.owner !== undefined) {
        // Handle owner status if it's a separate field in your DB schema or logic
        // For now, assuming it's part of the user object or a related concept
      }
    }

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

    // Update user table directly for fields like email, username, role etc.
    const userUpdateData: Record<string, any> = {};
    if (user.role === 'Admin') {
        if (updateData.username !== undefined) userUpdateData.username = updateData.username;
        if (updateData.email !== undefined) userUpdateData.email = updateData.email;
        if (updateData.role !== undefined) userUpdateData.role = updateData.role;
        if (updateData.verificationStatus !== undefined) userUpdateData.verificationStatus = updateData.verificationStatus;
        if (updateData.artistName !== undefined) userUpdateData.artistName = updateData.artistName; // Assuming artistName is in users table too
    }
    if (Object.keys(userUpdateData).length > 0) {
        await db.update(users).set(userUpdateData).where(eq(users.id, userId));
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
      user: user // Return user info too if it was updated
    });
  } catch (error) {
    console.error('Profile update error:', error);
    // More specific error handling for different types of errors
    if (error instanceof Error && error.message.includes('Invalid session')) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}