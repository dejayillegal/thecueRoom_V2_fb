import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { improveEPKText } from '@/lib/ai/epk-ai';

const ImproveTextSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(['professional', 'edgy', 'minimal', 'press']).optional().default('professional')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ImproveTextSchema.parse(body);

    const result = await improveEPKText(validated.text, validated.tone);

    return NextResponse.json({
      ok: true,
      text: result.text,
      usedAI: result.usedAI
    });
  } catch (error) {
    console.error('[EPK AI] Improve text error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Improvement failed'
    }, { status: 500 });
  }
}
