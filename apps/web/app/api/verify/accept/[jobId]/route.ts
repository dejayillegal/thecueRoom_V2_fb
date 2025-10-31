
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs, users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const adminHeader = request.headers.get('x-admin');
    if (adminHeader !== 'true') {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDbClient();
    const [job] = await db.select().from(verificationJobs).where(eq(verificationJobs.id, params.jobId));

    if (!job) {
      return NextResponse.json(
        { ok: false, message: 'Job not found' },
        { status: 404 }
      );
    }

    await db.update(verificationJobs)
      .set({
        status: 'completed',
        decision: 'approved',
        reviewedBy: 'admin',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationJobs.id, params.jobId));

    await db.update(users)
      .set({
        verified: true,
        verificationJobId: params.jobId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, job.userId));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Accept error:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Failed to accept' },
      { status: 500 }
    );
  }
}
