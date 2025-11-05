import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { monthlyPlaylistWorker } from '@thecueroom/server/monthlyPlaylistWorker';
import { z } from 'zod';

const QuerySchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = QuerySchema.safeParse({
      jobId: searchParams.get('jobId'),
    });

    if (!validatedQuery.success) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid query parameters',
        details: validatedQuery.error.issues,
      }, { status: 400 });
    }

    const { jobId } = validatedQuery.data;

    const result = await monthlyPlaylistWorker.getStatus(jobId);

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        error: result.error,
      }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[AI Status API] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch job status',
      message: error.message,
    }, { status: 500 });
  }
}
