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
    const [job] = await db
      .select()
      .from(verificationJobs)
      .where(eq(verificationJobs.id, params.jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      result: job.decision,
      score: job.score,
      notes: job.reviewNotes || '',
      evidence: job.evidence,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
