import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumThreads, threadLikes } from '@thecueroom/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const db = getDbClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: threadId } = await params;

    // Check if user already liked this thread
    const existingLike = await db
      .select()
      .from(threadLikes)
      .where(
        and(
          eq(threadLikes.threadId, threadId),
          eq(threadLikes.userId, session.uid)
        )
      )
      .limit(1);

    let liked = false;

    if (existingLike.length > 0) {
      // Unlike: remove like and decrement count
      await db
        .delete(threadLikes)
        .where(
          and(
            eq(threadLikes.threadId, threadId),
            eq(threadLikes.userId, session.uid)
          )
        );

      await db.update(forumThreads)
        .set({ 
          likesCount: sql`GREATEST(${forumThreads.likesCount} - 1, 0)`,
        })
        .where(eq(forumThreads.id, threadId));

      liked = false;
    } else {
      // Like: add like and increment count
      await db.insert(threadLikes).values({
        threadId,
        userId: session.uid,
        createdAt: new Date(),
      });

      await db.update(forumThreads)
        .set({ 
          likesCount: sql`${forumThreads.likesCount} + 1`,
        })
        .where(eq(forumThreads.id, threadId));

      liked = true;
    }

    // Get updated count
    const thread = await db.select({ likesCount: forumThreads.likesCount })
      .from(forumThreads)
      .where(eq(forumThreads.id, threadId))
      .limit(1);

    return NextResponse.json({ 
      liked,
      likesCount: thread[0]?.likesCount || 0,
    });

  } catch (error) {
    console.error('Like thread error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}