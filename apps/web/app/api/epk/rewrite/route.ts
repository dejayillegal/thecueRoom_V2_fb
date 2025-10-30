import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deterministicRewrite } from '@/lib/epk/rewrite-fallback';

const RewriteRequestSchema = z.object({
  text: z.string().min(10).max(5000),
  tone: z.enum(['press', 'concise', 'promotional', 'technical'])
});

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

async function tryHuggingFace(text: string, tone: string): Promise<any> {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return null;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Rewrite this artist bio in a ${tone} tone for a press kit:\n\n${text}\n\nRewritten bio:`,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data[0]?.generated_text || null;
  } catch {
    return null;
  }
}

async function tryProvider(text: string, tone: string): Promise<any> {
  const PROVIDER_URL = process.env.PROVIDER_URL;
  const PROVIDER_KEY = process.env.PROVIDER_KEY;

  if (!PROVIDER_URL || !PROVIDER_KEY) return null;

  try {
    const response = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PROVIDER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Rewrite this artist bio in a ${tone} tone for a press kit:\n\n${text}`
        }],
        max_tokens: 300
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { text, tone } = RewriteRequestSchema.parse(body);

    let result = null;
    let source = 'fallback';

    // Try Hugging Face first
    result = await tryHuggingFace(text, tone);
    if (result) {
      source = 'hf';
    } else {
      // Try provider fallback
      result = await tryProvider(text, tone);
      if (result) {
        source = 'provider';
      }
    }

    // Use deterministic fallback if all AI providers fail
    if (!result) {
      const fallbackOutput = deterministicRewrite(text, tone);
      return NextResponse.json({
        ok: true,
        source: 'fallback',
        outputs: fallbackOutput
      });
    }

    // Parse AI output into structured format
    const outputs = {
      tagline: result.split('\n')[0]?.substring(0, 80) || 'Electronic Music Artist',
      blurb: result.substring(0, 160),
      epk_bio: result
    };

    return NextResponse.json({
      ok: true,
      source,
      outputs
    });

  } catch (error) {
    console.error('[EPK Rewrite API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}