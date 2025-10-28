
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiQueue } from '@/lib/ai-queue';

const generateSchema = z.object({
  type: z.enum(['cover-art', 'meme', 'avatar']),
  prompt: z.string().optional(),
  style: z.string().optional(),
  template: z.string().optional(),
  topText: z.string().optional(),
  bottomText: z.string().optional(),
  watermark: z.boolean().optional(),
  artist: z.string().optional(),
  release: z.string().optional(),
  aspect: z.string().optional(),
  resolution: z.string().optional(),
  seed: z.string().optional(),
  hair: z.string().optional(),
  accentColor: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = generateSchema.parse(body);

    // In TEST_MODE, return mock job
    if (process.env.TEST_MODE === 'true') {
      const mockJobId = 'test-job-' + Date.now();
      return NextResponse.json({
        jobId: mockJobId,
        status: 'queued',
      }, { status: 202 });
    }

    // Build enhanced prompt
    const enhancedPrompt = data.prompt || '';
    const params = {
      style: data.style,
      aspect: data.aspect,
      resolution: data.resolution,
      seed: data.seed,
    };

    // Create and queue job
    const jobId = await aiQueue.createJob(
      data.type,
      enhancedPrompt,
      '00000000-0000-0000-0000-000000000000', // Replace with actual user ID from session
      params
    );

    return NextResponse.json({
      jobId,
      status: 'pending',
    }, { status: 202 });

  } catch (error) {
    console.error('AI generate API error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI job' },
      { status: 500 }
    );
  }
}
