import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { verificationTasks, verificationJobs, users, notifications, auditLogs } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// Simple admin auth check - in production, use proper auth
function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin') === 'true';
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDbClient();
    
    const tasks = await db
      .select({
        task: verificationTasks,
        job: verificationJobs,
        user: users,
      })
      .from(verificationTasks)
      .leftJoin(verificationJobs, eq(verificationTasks.jobId, verificationJobs.id))
      .leftJoin(users, eq(verificationTasks.userId, users.id))
      .where(eq(verificationTasks.status, 'pending'))
      .orderBy(desc(verificationTasks.createdAt))
      .limit(50);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Admin verification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const actionSchema = z.object({
  taskId: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, action, notes } = actionSchema.parse(body);
    const db = getDbClient();

    const [task] = await db
      .select()
      .from(verificationTasks)
      .where(eq(verificationTasks.id, taskId))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'verified_admin' : 'rejected_admin';
    
    await db
      .update(users)
      .set({
        verified: action === 'approve',
        verificationStatus: newStatus,
        verificationNotes: notes,
      })
      .where(eq(users.id, task.userId));

    if (task.jobId) {
      await db
        .update(verificationJobs)
        .set({
          decision: newStatus,
          reviewNotes: notes,
          completedAt: new Date(),
          status: 'completed',
          progress: 100,
        })
        .where(eq(verificationJobs.id, task.jobId));
    }

    await db
      .update(verificationTasks)
      .set({
        status: action === 'approve' ? 'approved' : 'denied',
        notes,
        resolvedAt: new Date(),
      })
      .where(eq(verificationTasks.id, taskId));

    await db.insert(notifications).values({
      userId: task.userId,
      type: action === 'approve' ? 'verification_approved' : 'verification_denied',
      title: action === 'approve' ? 'Profile Verified!' : 'Verification Update',
      message: action === 'approve' 
        ? 'Your profile has been verified by an admin. Welcome to thecueRoom!'
        : `Your verification was not approved. ${notes || 'Please update your profile and try again.'}`,
      link: '/dashboard',
    });

    await db.insert(auditLogs).values({
      userId: task.userId,
      action: `verification_${action}`,
      resource: 'verification_task',
      resourceId: taskId,
      changes: { action, notes },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ ok: true, action, userId: task.userId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Admin verification PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
