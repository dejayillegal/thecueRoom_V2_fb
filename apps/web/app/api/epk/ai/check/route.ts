import { NextResponse } from 'next/server';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    available: hasOpenAI,
    provider: hasOpenAI ? 'openai' : 'fallback'
  });
}
