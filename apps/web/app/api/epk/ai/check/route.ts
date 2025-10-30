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
  const hasHF = !!(process.env.HF_API_TOKEN || process.env.HUGGINGFACE_KEY);
  const hasPerplexity = !!process.env.PERPLEXITY_KEY;
  
  const available = hasOpenAI || hasHF || hasPerplexity;
  
  return NextResponse.json({
    available,
    providers: {
      openai: hasOpenAI,
      huggingface: hasHF,
      perplexity: hasPerplexity
    },
    priority: hasOpenAI ? 'openai' : hasPerplexity ? 'perplexity' : hasHF ? 'huggingface' : 'fallback'
  });
}
