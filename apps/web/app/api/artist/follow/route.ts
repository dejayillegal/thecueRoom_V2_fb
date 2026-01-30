import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDbClient } from '@thecueroom/db/client';
import { profiles, users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'artist' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetUsername } = await request.json();
    if (!targetUsername) {
      return NextResponse.json({ error: 'Target username required' }, { status: 400 });
    }

    const db = getDbClient();

    const targetUser = await db.select().from(users).where(eq(users.username, targetUsername)).limit(1);
    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const myProfile = await db.select().from(profiles).where(eq(profiles.userId, session.uid)).limit(1);
    if (myProfile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = myProfile[0];
    const socialLinks = (profile.socialLinks as Record<string, any>) || {};
    const following: string[] = socialLinks._following || [];

    if (!following.includes(targetUsername)) {
      following.push(targetUsername);
      await db.update(profiles)
        .set({ 
          socialLinks: { ...socialLinks, _following: following },
          updatedAt: new Date()
        })
        .where(eq(profiles.userId, session.uid));
    }

    return NextResponse.json({ success: true, following });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'artist' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetUsername } = await request.json();
    if (!targetUsername) {
      return NextResponse.json({ error: 'Target username required' }, { status: 400 });
    }

    const db = getDbClient();

    const myProfile = await db.select().from(profiles).where(eq(profiles.userId, session.uid)).limit(1);
    if (myProfile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = myProfile[0];
    const socialLinks = (profile.socialLinks as Record<string, any>) || {};
    let following: string[] = socialLinks._following || [];

    following = following.filter((u: string) => u !== targetUsername);
    await db.update(profiles)
      .set({ 
        socialLinks: { ...socialLinks, _following: following },
        updatedAt: new Date()
      })
      .where(eq(profiles.userId, session.uid));

    return NextResponse.json({ success: true, following });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
