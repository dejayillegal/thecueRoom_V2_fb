import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@thecueroom/db/client';
import { forumReports } from '@thecueroom/db/schema';
import { getSession } from '@/lib/auth';

const db = getDbClient();

const reportSchema = z.object({
  targetType: z.enum(['thread', 'reply']),
  targetId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = reportSchema.parse(body);

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

    return NextResponse.json({ reportId }, { status: 201 });

  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
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

    // Check if user is moderator/admin
    // For now, simple check - expand with role system

    const reports = await db.select()
      .from(forumReports)
      .where(eq(forumReports.status, 'open'))
      .orderBy(desc(forumReports.createdAt))
      .limit(50);

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('List reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}