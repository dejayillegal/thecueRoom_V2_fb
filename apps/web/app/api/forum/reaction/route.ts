
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { reactions, forumThreads, forumReplies } from '@thecueroom/db/schema';
import { reactionCreateSchema } from '@thecueroom/shared/forumSchemas';
import { getSession } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';

const db = getDbClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = reactionCreateSchema.parse(body);

    // Check if reaction already exists
    const [existing] = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.targetType, data.targetType),
          eq(reactions.targetId, data.targetId),
          eq(reactions.userId, session.uid)
        )
      )
      .limit(1);

    if (existing) {
      // Remove reaction (toggle off)
      await db
        .delete(reactions)
        .where(eq(reactions.id, existing.id));

      // Decrement counter
      if (data.targetType === 'thread') {
        await db
          .update(forumThreads)
          .set({ likesCount: sql`${forumThreads.likesCount} - 1` })
          .where(eq(forumThreads.id, data.targetId));
      } else if (data.targetType === 'reply') {
        await db
          .update(forumReplies)
          .set({ likesCount: sql`${forumReplies.likesCount} - 1` })
          .where(eq(forumReplies.id, data.targetId));
      }

      return NextResponse.json({ ok: true, liked: false });
    }

    // Add new reaction
    await db.insert(reactions).values({
      targetType: data.targetType,
      targetId: data.targetId,
      userId: session.uid,
      reaction: data.reaction,
    });

    // Increment counter
    if (data.targetType === 'thread') {
      await db
        .update(forumThreads)
        .set({ likesCount: sql`${forumThreads.likesCount} + 1` })
        .where(eq(forumThreads.id, data.targetId));
    } else if (data.targetType === 'reply') {
      await db
        .update(forumReplies)
        .set({ likesCount: sql`${forumReplies.likesCount} + 1` })
        .where(eq(forumReplies.id, data.targetId));
    }

    return NextResponse.json({ ok: true, liked: true });
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
