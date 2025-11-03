
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
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
      return null;
    }
  } catch (error) {
    console.error('[Follow API] Session error:', error);
  }
  return null;
}

// Follow user
export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUserId = await getCurrentUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement followers table and logic
    // For now, return success
    console.log(`[Follow API] User ${currentUserId} following ${params.username}`);

    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error('[Follow API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// Unfollow user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUserId = await getCurrentUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement followers table and logic
    console.log(`[Follow API] User ${currentUserId} unfollowing ${params.username}`);

    return NextResponse.json({ success: true, following: false });
  } catch (error) {
    console.error('[Follow API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}
