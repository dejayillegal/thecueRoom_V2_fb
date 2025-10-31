
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const db = getDbClient();
    const [job] = await db.select().from(verificationJobs).where(eq(verificationJobs.id, params.jobId));

    if (!job) {
      return NextResponse.json(
        { ok: false, message: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      status: job.status,
      decision: job.decision,
      score: job.score,
      evidence: job.evidence,
      error: job.error,
      updatedAt: job.updatedAt,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
