import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deterministicRewrite, truncate } from '@/lib/epk/rewrite-fallback';

const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();

const RewriteRequestSchema = z.object({
  text: z.string().min(1).max(4000),
  tone: z.enum(['press', 'concise', 'promotional', 'technical']).optional().default('press'),
});

type RewriteSource = 'hf' | 'provider' | 'fallback';

interface RewriteResponse {
  ok: boolean;
  source: RewriteSource;
  outputs?: {
    tagline: string;
    blurb: string;
    epk_bio: string;
  };
  tokensUsed?: number;
  error?: string;
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0] : 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = RATE_LIMIT_MAP.get(ip);
  
  if (!limit || now > limit.resetTime) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetTime: now + 10000 });
    return true;
  }
  
  if (limit.count >= 5) {
    return false;
  }
  
  limit.count++;
  return true;
}

async function tryHuggingFace(text: string, tone: string): Promise<RewriteResponse | null> {
  const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_KEY;
  
  if (!HF_TOKEN) {
    console.log('[Rewrite] HF_TOKEN not found, skipping Hugging Face');
    return null;
  }

  try {
    console.log('[Rewrite] Trying Hugging Face...');
    
    const prompt = `Rewrite the following artist bio in a ${tone} tone. Provide three versions:
1. A tagline (max 80 chars)
2. A short blurb for social media (90-160 chars)
3. A full EPK bio (300-500 chars)

Original bio: ${text}

Please respond with just the three versions, separated by newlines.`;

    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 512,
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('[Rewrite] HF rate limited');
        return null;
      }
      throw new Error(`HF API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result[0]?.generated_text || result.generated_text || '';
    
    if (!generatedText || generatedText.length < 50) {
      console.log('[Rewrite] HF response too short');
      return null;
    }

    const lines = generatedText.split('\n').filter((l: string) => l.trim());
    
    return {
      ok: true,
      source: 'hf',
      outputs: {
        tagline: truncate(lines[0] || 'Electronic Music Artist', 80),
        blurb: truncate(lines[1] || lines[0] || 'Innovative artist', 160),
        epk_bio: lines[2] || lines.join(' ') || generatedText
      },
      tokensUsed: generatedText.length / 4
    };
  } catch (error) {
    console.error('[Rewrite] HF error:', error);
    return null;
  }
}

async function tryProvider(text: string, tone: string): Promise<RewriteResponse | null> {
  const PROVIDER_URL = process.env.PROVIDER_URL;
  const PROVIDER_KEY = process.env.PROVIDER_KEY;
  
  if (!PROVIDER_URL || !PROVIDER_KEY) {
    console.log('[Rewrite] Provider credentials not found');
    return null;
  }

  try {
    console.log('[Rewrite] Trying provider...');
    
    const prompt = `Rewrite this artist bio in ${tone} style. Return 3 versions:\n1. Tagline (max 80 chars)\n2. Blurb (90-160 chars)\n3. Full bio (300-500 chars)\n\n${text}`;

    const response = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PROVIDER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Provider API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    if (!content) {
      return null;
    }

    const lines = content.split('\n').filter((l: string) => l.trim());
    
    return {
      ok: true,
      source: 'provider',
      outputs: {
        tagline: truncate(lines[0] || 'Electronic Music Artist', 80),
        blurb: truncate(lines[1] || lines[0] || 'Innovative artist', 160),
        epk_bio: lines[2] || content
      },
      tokensUsed: content.length / 4
    };
  } catch (error) {
    console.error('[Rewrite] Provider error:', error);
    return null;
  }
}

function useFallback(text: string, tone: 'press' | 'concise' | 'promotional' | 'technical'): RewriteResponse {
  console.log('[Rewrite] Using deterministic fallback');
  
  const result = deterministicRewrite(text, tone);
  
  return {
    ok: true,
    source: 'fallback',
    outputs: result
  };
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Max 5 requests per 10 seconds.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = RewriteRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request: ' + validation.error.message },
        { status: 400 }
      );
    }

    const { text, tone } = validation.data;

    let response: RewriteResponse | null = null;

    response = await tryHuggingFace(text, tone);
    
    if (!response) {
      response = await tryProvider(text, tone);
    }
    
    if (!response) {
      response = useFallback(text, tone);
    }

    console.log(`[Rewrite] Success via ${response.source}`);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Rewrite] Error:', error);
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
