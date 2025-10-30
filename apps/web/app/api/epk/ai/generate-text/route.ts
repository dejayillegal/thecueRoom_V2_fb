import { NextResponse } from 'next/server';
import { generateEPKText } from '@/lib/ai/epk-ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, artistName, genre, existingText, tone } = body;

    if (!type || !artistName) {
      return NextResponse.json(
        { error: 'Missing required fields: type and artistName' },
        { status: 400 }
      );
    }

    console.log('[EPK AI Generate] Request:', { type, artistName, genre, tone });

    const result = await generateEPKText({
      type,
      artistName,
      genre,
      existingText,
      tone: tone || 'professional'
    });

    console.log('[EPK AI Generate] Success:', { usedAI: result.usedAI, length: result.text.length });

    return NextResponse.json({
      text: result.text,
      usedAI: result.usedAI
    });
  } catch (error) {
    console.error('[EPK AI Generate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate text' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { generateEPKText } from '@/lib/ai/epk-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, artistName, genre, existingText } = body;

    if (!type || !artistName) {
      return NextResponse.json(
        { error: 'Missing required fields: type and artistName' },
        { status: 400 }
      );
    }

    const result = await generateEPKText({
      type,
      artistName,
      genre,
      existingText
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[EPK AI Generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}
