
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumReports } from '@thecueroom/db/schema';
import { moderationFlagSchema } from '@thecueroom/shared/forumSchemas';
import { getSession } from '@/lib/auth';

const db = getDbClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = moderationFlagSchema.parse(body);

    const reportId = crypto.randomUUID();

    await db.insert(forumReports).values({
      id: reportId,
      targetType: data.targetType,
      targetId: data.targetId,
      reporterId: session.uid,
      reason: data.reason,
      status: 'open',
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, reportId }, { status: 201 });
  } catch (error) {
    console.error('Flag content error:', error);
    return NextResponse.json(
      { error: 'Failed to flag content' },
      { status: 500 }
    );
  }
}
