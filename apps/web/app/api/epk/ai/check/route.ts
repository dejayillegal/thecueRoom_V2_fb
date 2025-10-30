import { NextResponse } from 'next/server';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    available: hasOpenAI,
    provider: hasOpenAI ? 'openai' : 'fallback'
  });
}
import { NextResponse } from 'next/server';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasHF = !!process.env.HF_API_TOKEN;
  
  return NextResponse.json({
    available: hasOpenAI || hasHF,
    providers: {
      openai: hasOpenAI,
      huggingface: hasHF
    }
  });
}
