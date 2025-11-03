
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@/lib/db-client';
import { forumThreads, forumReplies, users } from '@thecueroom/db/schema';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

const db = getDbClient();

const replySchema = z.object({
  content: z.string().min(1).max(10000),
  parentReplyId: z.string().uuid().optional(),
});

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    const sessionData = JSON.parse(sessionCookie.value);
    return sessionData.userId || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    
    const [thread] = await db
      .select()
      .from(forumThreads)
      .where(eq(forumThreads.id, threadId))
      .limit(1);
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Increment view count
    await db
      .update(forumThreads)
      .set({ viewCount: thread.viewCount + 1 })
      .where(eq(forumThreads.id, threadId));
    
    const replies = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.threadId, threadId))
      .orderBy(forumReplies.createdAt);
    
    return NextResponse.json({
      thread: { ...thread, viewCount: thread.viewCount + 1 },
      replies,
    });
    
  } catch (error) {
    console.error('Thread fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromSession();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id: threadId } = await params;
    const body = await request.json();
    const data = replySchema.parse(body);
    
    const [thread] = await db
      .select()
      .from(forumThreads)
      .where(eq(forumThreads.id, threadId))
      .limit(1);
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    if (thread.isLocked) {
      return NextResponse.json(
        { error: 'Thread is locked' },
        { status: 403 }
      );
    }
    
    const [reply] = await db
      .insert(forumReplies)
      .values({
        threadId,
        authorId: userId,
        content: data.content,
        parentReplyId: data.parentReplyId || null,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Update thread reply count and timestamp
    await db
      .update(forumThreads)
      .set({
        replyCount: thread.replyCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(forumThreads.id, threadId));
    
    return NextResponse.json({
      success: true,
      reply,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Reply creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}
