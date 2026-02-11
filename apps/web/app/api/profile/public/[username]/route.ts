import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles, forumThreads, forumReplies, threadLikes } from '@thecueroom/db/schema';
import { eq, desc, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const db = getDbClient();

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        verified: users.verified,
        verificationStatus: users.verificationStatus,
      })
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

    // Fetch activity
    const threads = await db
      .select({
        id: forumThreads.id,
        title: forumThreads.title,
        body: forumThreads.body,
        createdAt: forumThreads.createdAt,
        type: sql`'thread'`.as('type'),
        replyCount: forumThreads.replyCount,
        likesCount: forumThreads.likesCount
      })
      .from(forumThreads)
      .where(eq(forumThreads.userId, user.id))
      .limit(10);

    const activity = threads.map(t => ({
      id: t.id,
      artistName: profile?.artistName || user.username,
      username: user.username,
      profile: profile || { user },
      title: t.title,
      content: t.body?.substring(0, 200),
      timestamp: new Date(t.createdAt).toLocaleString(),
      stats: {
        replies: t.replyCount || 0,
        signals: t.likesCount || 0
      }
    }));

    return NextResponse.json({
      user: {
        ...user,
        profile: profile || {},
        activity
      },
    });
  } catch (error) {
    console.error('Public profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public profile' },
      { status: 500 }
    );
  }
}
