
import { NextResponse } from 'next/server';

export async function POST() {
  const hasHFKey = Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_KEY);
  const hasGeminiKey = Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  
  const provider = hasHFKey ? 'huggingface' : hasGeminiKey ? 'gemini' : 'fallback';
  
  console.log('🔄 Provider check requested:', {
    provider,
    hasHFKey,
    hasGeminiKey,
    timestamp: new Date().toISOString()
  });
  
  return NextResponse.json({
    provider,
    capabilities: {
      huggingface: hasHFKey,
      gemini: hasGeminiKey,
      fallback: true
    },
    message: hasHFKey || hasGeminiKey 
      ? `Using ${provider} for AI generation`
      : 'Using SVG fallback - add HF_TOKEN or GOOGLE_API_KEY to enable AI'
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
