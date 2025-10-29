import { NextResponse } from 'next/server';

export async function GET() {
  const hasAIKey = Boolean(
    process.env.HF_TOKEN || 
    process.env.HUGGINGFACE_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY
  );
  
  return NextResponse.json({
    hasAIKey,
  });
}

export const dynamic = 'force-dynamic';
