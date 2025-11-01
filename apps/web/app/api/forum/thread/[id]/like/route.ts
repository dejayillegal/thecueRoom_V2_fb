
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumThreads } from '@thecueroom/db/schema';
import { eq, sql } from 'drizzle-orm';
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

    // For now, simple toggle logic (in production, track in a separate likes table)
    // This is a simplified version - you'd want a proper likes table
    const thread = await db.select().from(forumThreads).where(eq(forumThreads.id, threadId)).limit(1);
    
    if (!thread || thread.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Simplified: just toggle the count (production should use a proper user_thread_likes table)
    const currentLikes = thread[0].likesCount || 0;
    const newLikes = currentLikes + 1; // Simplified - should check if user already liked

    await db.update(forumThreads)
      .set({ likesCount: newLikes })
      .where(eq(forumThreads.id, threadId));

    return NextResponse.json({ 
      liked: true, 
      likesCount: newLikes 
    });
  } catch (error) {
    console.error('[Forum] Like error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
