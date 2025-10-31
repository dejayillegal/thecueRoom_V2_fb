
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs } from '@thecueroom/db/schema';
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

    await db.update(verificationJobs)
      .set({
        status: 'completed',
        decision: 'rejected',
        reviewedBy: 'admin',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationJobs.id, params.jobId));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Reject error:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Failed to reject' },
      { status: 500 }
    );
  }
}
