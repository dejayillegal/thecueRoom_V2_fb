
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@thecueroom/db';
import { forumReplies, forumThreads, userReputation } from '@thecueroom/db/schema';
import { eq, sql } from 'drizzle-orm';
import { analyzeTextForToxicity, adjustKarma } from '@/packages/ai/moderation';
import { summarizeThread } from '@/packages/ai/summarizer';
import { getSession } from '@/lib/auth';

const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = replySchema.parse(body);
    const threadId = params.id;

    // AI Moderation
    const modResult = await analyzeTextForToxicity(data.body);
    const moderationStatus = modResult.decision === 'reject' ? 'rejected' : 
                            modResult.decision === 'review' ? 'pending' : 'approved';

    const replyId = crypto.randomUUID();

    await db.insert(forumReplies).values({
      id: replyId,
      threadId,
      userId: session.uid,
      body: data.body,
      toxicityScore: modResult.toxicity_score,
      aiFlags: modResult.flagged_terms,
      moderationStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update thread reply count
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

    return NextResponse.json({ 
      replyId,
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
