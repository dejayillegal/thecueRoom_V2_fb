import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const composeSchema = z.object({
  baseImageUrl: z.string().url(),
  artist: z.string().optional(),
  release: z.string().optional(),
  watermark: z.boolean().optional().default(true),
  mode: z.enum(['auto', 'editor']).optional().default('auto'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseImageUrl, artist, release, watermark, mode } = composeSchema.parse(body);

    // In TEST_MODE or when Sharp is available, compose server-side
    // For now, return success with client-side composition indicator
    const composeJobId = `compose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      composeJobId,
      message: 'Compose job created - using client-side composition',
      resultUrl: baseImageUrl, // Client will handle overlay
      metadata: {
        artist,
        release,
        watermark,
        mode,
      },
    }, { status: 202 });

  } catch (error) {
    console.error('Compose error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Composition failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Compose endpoint',
    features: ['text-overlay', 'watermark', 'auto-stamp'],
  });
}
