import { NextRequest, NextResponse } from 'next/server';
import { aiQueue } from '@/lib/ai-queue';
import { aiJobCreateRequestSchema } from '@/lib/schemas/ai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = aiJobCreateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { type, prompt, params, userId } = validationResult.data;

    const jobId = await aiQueue.createJob(type, prompt, userId, params);

    return NextResponse.json(
      { jobId },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('AI generate API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create AI job',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
