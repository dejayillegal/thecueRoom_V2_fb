
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, userProfiles, forumThreads, forumReplies } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

const db = getDbClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Fetch user
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
    
    // Fetch profile
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);
    
    // Fetch recent threads
    const threads = await db
      .select()
      .from(forumThreads)
      .where(eq(forumThreads.authorId, user.id))
      .orderBy(forumThreads.createdAt)
      .limit(10);
    
    // Fetch recent replies count
    const replies = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.authorId, user.id))
      .limit(100);
    
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: profile || null,
      stats: {
        threadsCount: threads.length,
        repliesCount: replies.length,
      },
      recentThreads: threads.slice(0, 5),
    });
    
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
