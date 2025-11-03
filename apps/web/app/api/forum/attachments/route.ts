import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { forumAttachments, aiJobs } from '@thecueroom/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const db = getDbClient();

const attachmentSchema = z.object({
  postType: z.enum(['thread', 'reply']),
  postId: z.string().uuid(),
  type: z.enum(['image', 'ai_meme', 'ai_cover', 'file']),
  url: z.string(),
  filename: z.string().optional(),
  size: z.number().optional(),
  aiJobId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = attachmentSchema.parse(body);

    if (data.type.startsWith('ai_') && data.aiJobId) {
      const [job] = await db
        .select()
        .from(aiJobs)
        .where(
          and(
            eq(aiJobs.id, data.aiJobId),
            eq(aiJobs.userId, session.uid)
          )
        )
        .limit(1);

      if (!job) {
        return NextResponse.json(
          { error: 'AI job not found or not owned by you' },
          { status: 403 }
        );
      }
    }

    const [attachment] = await db
      .insert(forumAttachments)
      .values({
        postType: data.postType,
        postId: data.postId,
        userId: session.uid,
        type: data.type,
        url: data.url,
        filename: data.filename,
        size: data.size,
        aiJobId: data.aiJobId,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      attachment,
      message: 'Attachment added successfully',
    });
  } catch (error) {
    console.error('Forum attachment error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add attachment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postType = searchParams.get('postType');
    const postId = searchParams.get('postId');

    if (!postType || !postId) {
      return NextResponse.json(
        { error: 'postType and postId required' },
        { status: 400 }
      );
    }

    const attachments = await db
      .select()
      .from(forumAttachments)
      .where(
        and(
          eq(forumAttachments.postType, postType),
          eq(forumAttachments.postId, postId)
        )
      );

    return NextResponse.json({
      ok: true,
      attachments,
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
