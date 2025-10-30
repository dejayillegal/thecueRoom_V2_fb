import { NextResponse } from 'next/server';
import { improveEPKText } from '@/lib/ai/epk-ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, tone } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    console.log('[EPK AI Improve] Request:', { tone, textLength: text.length });

    const result = await improveEPKText(text, tone || 'professional');

    console.log('[EPK AI Improve] Success:', { usedAI: result.usedAI, length: result.text.length });

    return NextResponse.json({
      text: result.text,
      usedAI: result.usedAI
    });
  } catch (error) {
    console.error('[EPK AI Improve] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to improve text' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;