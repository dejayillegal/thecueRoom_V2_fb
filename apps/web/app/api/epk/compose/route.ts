import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ComposeRequestSchema = z.object({
  imageUrl: z.string(),
  artistName: z.string(),
  watermark: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, artistName, watermark } = ComposeRequestSchema.parse(body);

    return NextResponse.json({
      ok: true,
      message: 'Composition endpoint - for watermarking and text overlay',
      note: 'This would use sharp to add text/watermarks to images'
    });
  } catch (error) {
    console.error('[EPK API] Compose error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
