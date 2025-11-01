
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeTextForToxicity } from '@thecueroom/ai/moderation';

const moderateSchema = z.object({
  text: z.string().min(1).max(10000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = moderateSchema.parse(body);

    const result = await analyzeTextForToxicity(data.text);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { error: 'Moderation failed' },
      { status: 500 }
    );
  }
}
