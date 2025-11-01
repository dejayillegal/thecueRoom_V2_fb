import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@thecueroom/db/client';
import { forumReplies, forumThreads, userReputation } from '@thecueroom/db/schema';
import { eq, sql } from 'drizzle-orm';
import { analyzeTextForToxicity } from '@thecueroom/ai/moderation';
import { getSession } from '@/lib/auth';

const db = getDbClient();

const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = replySchema.parse(body);
    const { id: threadId } = await params;

    // AI Moderation
    const modResult = await analyzeTextForToxicity(data.body);
    const moderationStatus = modResult.decision === 'reject' ? 'rejected' : 
                            modResult.decision === 'review' ? 'pending' : 'approved';

    const replyId = crypto.randomUUID();

    const [newReply] = await db.insert(forumReplies).values({
      id: replyId,
      threadId,
      userId: session.uid,
      body: data.body,
      toxicityScore: modResult.toxicity_score,
      aiFlags: modResult.flagged_terms,
      moderationStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Update thread reply count only for approved replies
    if (moderationStatus === 'approved') {
      await db.update(forumThreads)
        .set({ 
          replyCount: sql`${forumThreads.replyCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(forumThreads.id, threadId));

      // Update user karma
      await db.insert(userReputation)
        .values({
          userId: session.uid,
          karmaPoints: 1,
        })
        .onConflictDoUpdate({
          target: userReputation.userId,
          set: {
            karmaPoints: sql`${userReputation.karmaPoints} + 1`,
            updatedAt: new Date(),
          },
        });

      // Check if thread needs AI summary (>15 replies)
      const thread = await db.select({ replyCount: forumThreads.replyCount, body: forumThreads.body })
        .from(forumThreads)
        .where(eq(forumThreads.id, threadId))
        .limit(1);

      if (thread[0] && thread[0].replyCount >= 15) {
        const allReplies = await db.select({ body: forumReplies.body })
          .from(forumReplies)
          .where(eq(forumReplies.threadId, threadId))
          .limit(20);

        const fullText = thread[0].body + ' ' + allReplies.map(r => r.body).join(' ');
        const summary = await summarizeThread(fullText);

        await db.update(forumThreads)
          .set({ aiSummary: summary })
          .where(eq(forumThreads.id, threadId));
      }
    }

    // Fetch user data for the reply
    const userInfo = await db
      .select({
        username: users.username,
        displayName: profiles.displayName,
        avatar: profiles.avatar,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(users.id, session.uid))
      .limit(1);

    return NextResponse.json({ 
      reply: {
        ...newReply,
        username: userInfo[0]?.username,
        displayName: userInfo[0]?.displayName,
        avatar: userInfo[0]?.avatar,
      },
      moderation: modResult,
      status: moderationStatus,
    }, { status: 201 });

  } catch (error) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = z.coerce.number().int().positive().safeParse(searchParams.get('limit')).data || 50;

    const threads = await db.select({
      id: forumThreads.id,
      title: forumThreads.title,
      slug: forumThreads.slug,
      createdAt: forumThreads.createdAt,
      updatedAt: forumThreads.updatedAt,
      replyCount: forumThreads.replyCount,
      author: {
        id: forumThreads.userId,
        username: forumThreads.authorUsername,
        avatarUrl: forumThreads.authorAvatarUrl,
      },
      firstReply: {
        body: forumReplies.body,
        createdAt: forumReplies.createdAt,
        author: {
          id: forumReplies.userId,
          username: forumReplies.authorUsername,
          avatarUrl: forumReplies.authorAvatarUrl,
        }
      }
    })
    .from(forumThreads)
    .leftJoin(forumReplies, eq(forumThreads.id, forumReplies.threadId))
    .where(
      sql`
        ${forumThreads.isHidden} = false AND
        ${forumThreads.isLocked} = false AND
        ${forumThreads.isPinned} = false AND
        ${forumThreads.isDeleted} = false AND
        ${forumThreads.isDraft} = false AND
        ${forumReplies.id} IS NULL OR ${forumReplies.createdAt} = (
          SELECT MIN(fr.createdAt)
          FROM forum_replies fr
          WHERE fr.threadId = forumThreads.id
        )
      `
    )
    .orderBy(
      sql`CASE WHEN ${forumThreads.isPinned} THEN 0 ELSE 1 END, ${forumThreads.updatedAt} DESC`
    )
    .groupBy(forumThreads.id)
    .limit(limit);

    return NextResponse.json(threads);
  } catch (error) {
    console.error('List threads error:', error);
    return NextResponse.json(
      { error: 'Failed to list threads' },
      { status: 500 }
    );
  }
}