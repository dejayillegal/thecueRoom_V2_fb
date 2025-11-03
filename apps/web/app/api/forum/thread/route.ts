import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@/lib/db-client';
import { forumThreads, forumReplies } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const db = getDbClient();

const createThreadSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(10000),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.uid) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.uid;

    const body = await request.json();
    const data = createThreadSchema.parse(body);

    const [thread] = await db
      .insert(forumThreads)
      .values({
        categoryId: data.categoryId,
        authorId: userId,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        replyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      threadId: thread.id,
      thread,
    }, { status: 201 });

  } catch (error) {
    console.error('Thread creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = db.select().from(forumThreads);

    if (categoryId) {
      query = query.where(eq(forumThreads.categoryId, categoryId)) as any;
    }

    const threads = await query
      .limit(limit)
      .offset(offset)
      .orderBy(forumThreads.isPinned, forumThreads.updatedAt);

    return NextResponse.json({
      threads,
      pagination: {
        page,
        limit,
        hasMore: threads.length === limit,
      },
    });

  } catch (error) {
    console.error('Thread fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}