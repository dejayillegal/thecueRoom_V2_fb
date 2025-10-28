
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db-client';
import { aiJobs } from '@/packages/db/schema';

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

    // Create job in database
    const jobId = crypto.randomUUID();
    
    await db.insert(aiJobs).values({
      id: jobId,
      userId: '00000000-0000-0000-0000-000000000000', // Replace with actual user ID from session
      type: data.type,
      prompt: data.prompt || JSON.stringify(data),
      status: 'queued',
      createdAt: new Date(),
    });

    // Queue job for processing (implement queue worker separately)
    // await queueAIJob(jobId, data);

    return NextResponse.json({
      jobId,
      status: 'queued',
    }, { status: 202 });

  } catch (error) {
    console.error('AI generate API error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI job' },
      { status: 500 }
    );
  }
}
