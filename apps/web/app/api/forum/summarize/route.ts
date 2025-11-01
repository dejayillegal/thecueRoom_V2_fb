
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { summarizeThread } from '../../../../../packages/ai/summarizer';

const summarizeSchema = z.object({
  text: z.string().min(10).max(10000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = summarizeSchema.parse(body);

    const summary = await summarizeThread(data.text);

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Summarization failed' },
      { status: 500 }
    );
  }
}
