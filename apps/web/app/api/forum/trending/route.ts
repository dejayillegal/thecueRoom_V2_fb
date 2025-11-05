import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumThreads } from '@thecueroom/db/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      limit: searchParams.get('limit'),
    });

    const limit = Math.min(params.limit, 50);

    const db = getDbClient();

    const threads = await db
      .select({
        id: forumThreads.id,
        title: forumThreads.title,
        slug: forumThreads.slug,
        replies: forumThreads.replyCount,
        likes: forumThreads.likesCount,
        views: forumThreads.viewCount,
        categoryId: forumThreads.categoryId,
        userId: forumThreads.userId,
        createdAt: forumThreads.createdAt,
        updatedAt: forumThreads.updatedAt,
        isPinned: forumThreads.isPinned,
        tags: forumThreads.tags,
      })
      .from(forumThreads)
      .orderBy(desc(forumThreads.likesCount), desc(forumThreads.replyCount))
      .limit(limit);

    return NextResponse.json({
      ok: true,
      threads,
    });
  } catch (error) {
    console.error('[Forum Trending API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch trending threads' },
      { status: 500 }
    );
  }
}
