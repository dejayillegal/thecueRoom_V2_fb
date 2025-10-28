
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db-client';
import { forumThreads, forumPosts } from '@/packages/db/schema';

const createThreadSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  categoryId: z.string(),
});

export async function GET() {
  try {
    // In TEST_MODE, return mock threads
    if (process.env.TEST_MODE === 'true') {
      return NextResponse.json({
        threads: [
          {
            id: '1',
            title: 'Welcome to thecueRoom',
            categoryId: 'general',
            userId: 'user1',
            userName: 'Admin',
            replyCount: 5,
            upvotes: 12,
            isPinned: true,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const threads = await db.select().from(forumThreads).limit(50);

    return NextResponse.json({ threads });

  } catch (error) {
    console.error('Forum threads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createThreadSchema.parse(body);

    const threadId = crypto.randomUUID();
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await db.insert(forumThreads).values({
      id: threadId,
      categoryId: data.categoryId,
      userId: '00000000-0000-0000-0000-000000000000', // Replace with actual user ID
      title: data.title,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create first post
    await db.insert(forumPosts).values({
      id: crypto.randomUUID(),
      threadId,
      userId: '00000000-0000-0000-0000-000000000000',
      content: data.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ threadId }, { status: 201 });

  } catch (error) {
    console.error('Create thread error:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
