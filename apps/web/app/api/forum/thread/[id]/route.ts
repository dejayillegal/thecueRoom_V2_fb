import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumThreads, forumReplies, users, profiles, threadLikes } from '@thecueroom/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const db = getDbClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const session = await getSession();

    // Increment view count
    await db.update(forumThreads)
      .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
      .where(eq(forumThreads.id, threadId));

    const thread = await db.select({
      id: forumThreads.id,
      title: forumThreads.title,
      body: forumThreads.body,
      categoryId: forumThreads.categoryId,
      userId: forumThreads.userId,
      isPinned: forumThreads.isPinned,
      isLocked: forumThreads.isLocked,
      likesCount: forumThreads.likesCount,
      replyCount: forumThreads.replyCount,
      viewCount: forumThreads.viewCount,
      aiSummary: forumThreads.aiSummary,
      embedLinks: forumThreads.embedLinks,
      createdAt: forumThreads.createdAt,
      username: users.username,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
      verified: users.verified,
    })
    .from(forumThreads)
    .leftJoin(users, eq(forumThreads.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(forumThreads.id, threadId))
    .limit(1);

    if (!thread[0]) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const replies = await db.select({
      id: forumReplies.id,
      threadId: forumReplies.threadId,
      userId: forumReplies.userId,
      body: forumReplies.body,
      username: users.username,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
      likesCount: forumReplies.likesCount,
      createdAt: forumReplies.createdAt,
    })
    .from(forumReplies)
    .leftJoin(users, eq(forumReplies.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(and(
      eq(forumReplies.threadId, threadId),
      eq(forumReplies.moderationStatus, 'approved')
    ))
    .orderBy(forumReplies.createdAt);

    // Check if current user liked this thread
    let liked = false;
    if (session?.uid) {
      const userLike = await db
        .select()
        .from(threadLikes)
        .where(
          and(
            eq(threadLikes.threadId, threadId),
            eq(threadLikes.userId, session.uid)
          )
        )
        .limit(1);
      liked = userLike.length > 0;
    }

    return NextResponse.json({ 
      thread: { ...thread[0], liked }, 
      replies 
    });

  } catch (error) {
    console.error('Get thread error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}