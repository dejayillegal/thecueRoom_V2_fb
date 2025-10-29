import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateEPKText } from '@/lib/ai/epk-ai';

const GenerateTextSchema = z.object({
  type: z.enum(['bio', 'press_quote', 'tech_rider', 'promo_text']),
  artistName: z.string().min(1),
  genre: z.string().optional(),
  existingText: z.string().optional(),
  tone: z.enum(['professional', 'edgy', 'minimal', 'press']).optional().default('professional')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GenerateTextSchema.parse(body);

    const result = await generateEPKText(validated);

    if (!result.text || result.text.trim().length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Failed to generate text - please try again'
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      text: result.text,
      usedAI: result.usedAI
    });
  } catch (error) {
    console.error('[EPK AI] Generate text error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    }, { status: 500 });
  }
}
