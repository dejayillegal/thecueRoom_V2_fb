import { NextRequest, NextResponse } from 'next/server';
import { generateEPKText } from '@/lib/ai/epk-ai';
import { z } from 'zod';

const GenerateTextSchema = z.object({
  type: z.enum(['bio', 'press_quote', 'tech_rider', 'promo_text']),
  artistName: z.string(),
  genre: z.string().optional(),
  existingText: z.string().optional(),
  tone: z.enum(['professional', 'edgy', 'minimal', 'press']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GenerateTextSchema.parse(body);

    console.log('[EPK AI Generate]', validated);

    const result = await generateEPKText(validated);

    return NextResponse.json({
      ok: true,
      text: result.text,
      usedAI: result.usedAI
    });
  } catch (error) {
    console.error('[EPK AI Generate] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;