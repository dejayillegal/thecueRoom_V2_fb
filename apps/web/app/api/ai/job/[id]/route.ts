import { NextRequest, NextResponse } from 'next/server';
import { aiQueue } from '@/lib/ai-queue';
import { aiJobResponseSchema } from '@/lib/schemas/ai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = await aiQueue.getJob(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const response = {
      id: job.id,
      type: job.type,
      prompt: job.prompt,
      params: job.params,
      status: job.status,
      resultUrl: job.resultUrl,
      error: job.error,
      retryCount: job.retryCount,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
    };

    const validationResult = aiJobResponseSchema.safeParse(response);
    
    if (!validationResult.success) {
      console.error('Response validation error:', validationResult.error);
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(validationResult.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': job.status === 'completed' || job.status === 'failed' 
          ? 'public, max-age=3600' 
          : 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('AI job status API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
