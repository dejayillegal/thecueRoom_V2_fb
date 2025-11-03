
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { threadDrafts } from '@thecueroom/db/schema';
import { draftSaveSchema } from '@thecueroom/shared/forumSchemas';
import { getSession } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

const db = getDbClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = draftSaveSchema.parse(body);

    // Upsert draft (one per user)
    const [draft] = await db
      .insert(threadDrafts)
      .values({
        userId: session.uid,
        title: data.title,
        categoryId: data.categoryId,
        body: data.body,
        tags: data.tags || [],
        visibility: data.visibility || 'public',
        metadata: data.metadata || {},
        lastSavedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: threadDrafts.userId,
        set: {
          title: data.title,
          categoryId: data.categoryId,
          body: data.body,
          tags: data.tags || [],
          visibility: data.visibility || 'public',
          metadata: data.metadata || {},
          lastSavedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    console.error('Save draft error:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [draft] = await db
      .select()
      .from(threadDrafts)
      .where(eq(threadDrafts.userId, session.uid))
      .limit(1);

    return NextResponse.json({ ok: true, draft: draft || null });
  } catch (error) {
    console.error('Get draft error:', error);
    return NextResponse.json(
      { error: 'Failed to get draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .delete(threadDrafts)
      .where(eq(threadDrafts.userId, session.uid));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
