
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const db = getDbClient();

    const [job] = await db
      .select()
      .from(verificationJobs)
      .where(eq(verificationJobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        status: job.status,
        decision: job.decision,
        confidence: job.score,
        progress: job.progress,
        metadata: job.evidence,
      },
    });
  } catch (error) {
    console.error('Verification job status error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: 'Job ID required' },
        { status: 400 }
      );
    }

    const db = getDbClient();

    const [job] = await db
      .select()
      .from(verificationJobs)
      .where(eq(verificationJobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        status: job.status,
        decision: job.decision,
        confidence: job.confidence,
        progress: job.progress || 0,
        metadata: job.metadata || {},
      },
    });
  } catch (error) {
    console.error('Verification job status error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
