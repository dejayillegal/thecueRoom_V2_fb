import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@/lib/db-client';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

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

    const db = getDbClient();
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const result = await db.execute(sql`
      INSERT INTO forum_threads (user_id, category_id, title, slug, body, tags, view_count, reply_count, likes_count, is_pinned, moderation_status, created_at, updated_at)
      VALUES (${userId}::uuid, ${data.categoryId}::uuid, ${data.title}, ${slug}, ${data.content}, ${JSON.stringify(data.tags || [])}::jsonb, 0, 0, 0, false, 'pending', NOW(), NOW())
      RETURNING id, title, slug
    `);

    const thread = result.rows?.[0] as { id: string; title: string; slug: string } | undefined;

    if (!thread) {
      throw new Error('Failed to create thread');
    }

    await db.execute(sql`
      UPDATE forum_categories SET thread_count = thread_count + 1 WHERE id = ${data.categoryId}::uuid
    `);

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

    let orderClause = 'ORDER BY t.is_pinned DESC, t.created_at DESC';
    let additionalWhere = '';

    if (sort === 'trending') {
      orderClause = 'ORDER BY t.likes_count DESC, t.view_count DESC';
    } else if (sort === 'unanswered') {
      additionalWhere = 'AND t.reply_count = 0';
      orderClause = 'ORDER BY t.created_at DESC';
    }

    if (categoryId) {
      additionalWhere += ` AND t.category_id = '${categoryId}'`;
    }

    const results = await db.execute(sql`
      SELECT 
        t.id, t.title, t.slug, t.body, t.tags, t.view_count, t.reply_count, 
        t.likes_count, t.is_pinned, t.moderation_status, t.created_at, t.updated_at,
        u.username, u.verified,
        p.display_name, p.artist_name,
        c.name as category_name, c.slug as category_slug
      FROM forum_threads t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN forum_categories c ON t.category_id = c.id
      WHERE t.moderation_status = 'approved' ${sql.raw(additionalWhere)}
      ${sql.raw(orderClause)}
      LIMIT ${limit} OFFSET ${offset}
    `);

    const threads = (results.rows || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      body: row.body,
      tags: row.tags,
      viewCount: row.view_count,
      replyCount: row.reply_count,
      likesCount: row.likes_count,
      isPinned: row.is_pinned,
      moderationStatus: row.moderation_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        username: row.username,
        verified: row.verified,
      },
      profile: {
        displayName: row.display_name,
        artistName: row.artist_name,
      },
      category: {
        name: row.category_name,
        slug: row.category_slug,
      },
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