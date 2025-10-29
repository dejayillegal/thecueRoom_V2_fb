import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { improveEPKText } from '@/lib/ai/epk-ai';

const RewriteRequestSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(['press', 'bio', 'concise', 'brutalist']).optional().default('bio')
});

const toneMapping: Record<string, 'professional' | 'edgy' | 'minimal' | 'press'> = {
  press: 'press',
  bio: 'professional',
  concise: 'minimal',
  brutalist: 'edgy'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RewriteRequestSchema.parse(body);

    const mappedTone = toneMapping[validated.tone] || 'professional';
    const result = await improveEPKText(validated.text, mappedTone);

    if (!result.text || result.text.trim().length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Failed to rewrite text - please try again'
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      rewritten: result.text,
      usedHF: result.usedAI
    });
  } catch (error) {
    console.error('[EPK AI] Rewrite error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Rewrite failed'
    }, { status: 500 });
  }
}
