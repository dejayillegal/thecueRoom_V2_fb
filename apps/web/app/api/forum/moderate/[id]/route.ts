import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumThreads, forumReplies } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const db = getDbClient();

const moderationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'lock']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = moderationActionSchema.parse(body);

    // Determine if this is a thread or reply by checking both tables
    const thread = await db
      .select()
      .from(forumThreads)
      .where(eq(forumThreads.id, id))
      .limit(1);

    const reply = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.id, id))
      .limit(1);

    if (thread.length === 0 && reply.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const isThread = thread.length > 0;

    switch (action) {
      case 'approve':
        // For approved content, just update moderation status
        if (isThread) {
          await db
            .update(forumThreads)
            .set({ 
              moderationStatus: 'approved',
              updatedAt: new Date(),
            })
            .where(eq(forumThreads.id, id));
        } else {
          await db
            .update(forumReplies)
            .set({ 
              moderationStatus: 'approved',
              updatedAt: new Date(),
            })
            .where(eq(forumReplies.id, id));
        }
        break;

      case 'reject':
        // For rejected content, mark as deleted/hidden
        if (isThread) {
          await db
            .update(forumThreads)
            .set({ 
              moderationStatus: 'rejected',
              isDeleted: true,
              updatedAt: new Date(),
            })
            .where(eq(forumThreads.id, id));
        } else {
          await db
            .update(forumReplies)
            .set({ 
              moderationStatus: 'rejected',
              isDeleted: true,
              updatedAt: new Date(),
            })
            .where(eq(forumReplies.id, id));
        }
        break;

      case 'lock':
        // Lock only applies to threads
        if (isThread) {
          await db
            .update(forumThreads)
            .set({ 
              isLocked: true,
              moderationStatus: 'locked',
              updatedAt: new Date(),
            })
            .where(eq(forumThreads.id, id));
        } else {
          return NextResponse.json(
            { error: 'Cannot lock a reply, only threads' },
            { status: 400 }
          );
        }
        break;
    }

    return NextResponse.json({
      success: true,
      action,
      contentType: isThread ? 'thread' : 'reply',
      message: `Content ${action}d successfully`,
    });

  } catch (error: any) {
    console.error('Moderation action error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform moderation action', details: error.message },
      { status: 500 }
    );
  }
}
