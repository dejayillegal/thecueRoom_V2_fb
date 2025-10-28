
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-client';
import { aiJobs } from '@/packages/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // In TEST_MODE, return mock completed job
    if (process.env.TEST_MODE === 'true') {
      return NextResponse.json({
        id: jobId,
        status: 'completed',
        progress: 100,
        resultUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzBiMGIwYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNEMUZGM0QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj50aGVjdWVSb29tPC90ZXh0Pjwvc3ZnPg==',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }

    const [job] = await db.select().from(aiJobs).where(eq(aiJobs.id, jobId)).limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress || 0,
      resultUrl: job.resultUrl,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
