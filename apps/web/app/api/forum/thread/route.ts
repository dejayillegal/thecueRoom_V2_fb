import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@/lib/db-client';
import { forumThreads, forumReplies, users, profiles, forumCategories } from '@thecueroom/db/schema';
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
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const db = getDbClient();

    // Build the query with joins
    let query = db
      .select({
        thread: forumThreads,
        user: {
          username: users.username,
          verified: users.verified,
        },
        profile: {
          displayName: profiles.displayName,
          avatar: profiles.avatar,
        },
        category: {
          name: forumCategories.name,
        },
      })
      .from(forumThreads)
      .leftJoin(users, eq(forumThreads.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(forumCategories, eq(forumThreads.categoryId, forumCategories.id))
      .where(eq(forumThreads.isHidden, false));

    if (categoryId) {
      query = query.where(eq(forumThreads.categoryId, categoryId)) as any;
    }

    // Apply sorting
    if (sort === 'trending') {
      query = query.orderBy(forumThreads.likesCount, forumThreads.viewCount);
    } else if (sort === 'unanswered') {
      query = query.where(eq(forumThreads.replyCount, 0));
      query = query.orderBy(forumThreads.createdAt);
    } else {
      // newest
      query = query.orderBy(forumThreads.isPinned, forumThreads.createdAt);
    }

    const results = await query.limit(limit).offset(offset);

    // Transform results
    const threads = results.map((row) => ({
      ...row.thread,
      user: row.user,
      profile: row.profile,
      category: row.category,
    }));

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