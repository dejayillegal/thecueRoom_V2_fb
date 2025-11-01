
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@thecueroom/db/client';
import { forumThreads, forumCategories, users, profiles, userReputation } from '@thecueroom/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { analyzeTextForToxicity } from '@thecueroom/ai/moderation';
import { getSession } from '@/lib/auth';

const db = getDbClient();

const createThreadSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(10000),
  categoryId: z.string().uuid(),
  embedLinks: z.array(z.string().url()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createThreadSchema.parse(body);

    // AI Moderation check
    const modResult = await analyzeTextForToxicity(`${data.title} ${data.body}`);
    
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 100);
    const threadId = crypto.randomUUID();

    const moderationStatus = modResult.decision === 'reject' ? 'rejected' : 
                            modResult.decision === 'review' ? 'pending' : 'approved';
    const isHidden = moderationStatus !== 'approved';

    await db.insert(forumThreads).values({
      id: threadId,
      categoryId: data.categoryId,
      userId: session.uid,
      title: data.title,
      slug: `${slug}-${threadId.slice(0, 8)}`,
      body: data.body,
      embedLinks: data.embedLinks || [],
      toxicityScore: modResult.toxicity_score,
      moderationStatus,
      isHidden,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update category thread count
    await db.update(forumCategories)
      .set({ 
        threadCount: sql`${forumCategories.threadCount} + 1` 
      })
      .where(eq(forumCategories.id, data.categoryId));

    return NextResponse.json({ 
      threadId, 
      moderation: modResult,
      status: moderationStatus 
    }, { status: 201 });

  } catch (error) {
    console.error('Create thread error:', error);
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause = categoryId 
      ? and(eq(forumThreads.categoryId, categoryId), eq(forumThreads.isHidden, false))
      : eq(forumThreads.isHidden, false);

    const threads = await db.select({
      id: forumThreads.id,
      title: forumThreads.title,
      slug: forumThreads.slug,
      categoryId: forumThreads.categoryId,
      userId: forumThreads.userId,
      isPinned: forumThreads.isPinned,
      likesCount: forumThreads.likesCount,
      replyCount: forumThreads.replyCount,
      viewCount: forumThreads.viewCount,
      aiSummary: forumThreads.aiSummary,
      embedLinks: forumThreads.embedLinks,
      createdAt: forumThreads.createdAt,
      updatedAt: forumThreads.updatedAt,
      username: users.username,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
      verified: users.verified,
    })
    .from(forumThreads)
    .leftJoin(users, eq(forumThreads.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(whereClause)
    .orderBy(desc(forumThreads.isPinned), desc(forumThreads.createdAt))
    .limit(limit)
    .offset(offset);

    return NextResponse.json({ threads });

  } catch (error: any) {
    console.error('List threads error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch threads', message: error?.message },
      { status: 500 }
    );
  }
}
