
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumReports, modActions, forumThreads, forumReplies } from '@thecueroom/db/schema';
import { moderationReviewSchema } from '@thecueroom/shared/forumSchemas';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

const db = getDbClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/moderator
    // This should use proper RBAC - simplified for now
    const body = await request.json();
    const reportId = body.reportId;
    const data = moderationReviewSchema.parse(body);

    // Get report
    const [report] = await db
      .select()
      .from(forumReports)
      .where(eq(forumReports.id, reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update report status
    await db
      .update(forumReports)
      .set({
        status: data.action === 'approve' ? 'resolved' : 'rejected',
        resolvedBy: session.uid,
        resolvedAt: new Date(),
      })
      .where(eq(forumReports.id, reportId));

    // Log moderation action
    await db.insert(modActions).values({
      moderatorId: session.uid,
      action: data.action,
      targetType: report.targetType,
      targetId: report.targetId,
      notes: data.notes,
    });

    // Take action on content if needed
    if (data.action === 'reject') {
      if (report.targetType === 'thread') {
        await db
          .update(forumThreads)
          .set({ isHidden: true })
          .where(eq(forumThreads.id, report.targetId));
      } else if (report.targetType === 'reply') {
        await db
          .update(forumReplies)
          .set({ moderationStatus: 'rejected' })
          .where(eq(forumReplies.id, report.targetId));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Review moderation error:', error);
    return NextResponse.json(
      { error: 'Failed to review content' },
      { status: 500 }
    );
  }
}
