
import { NextResponse } from 'next/server';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasPerplexity = !!process.env.PERPLEXITY_KEY;
  const hasHuggingFace = !!process.env.HUGGINGFACE_KEY || !!process.env.HF_API_TOKEN;
  
  const hasAnyAI = hasOpenAI || hasPerplexity || hasHuggingFace;

  console.log('[EPK AI Check]', {
    hasOpenAI,
    hasPerplexity,
    hasHuggingFace,
    hasAnyAI,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    available: hasAnyAI,
    providers: {
      openai: hasOpenAI,
      perplexity: hasPerplexity,
      huggingface: hasHuggingFace
    }
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
