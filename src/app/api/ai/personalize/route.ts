
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { personalizeNewsForUser } from '@/app/actions/ai-actions';
import { z } from 'zod';

const RequestSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      summary: z.string().optional().default(''),
      source: z.string().optional().default(''),
      tags: z.array(z.string()).optional().default([]),
    })
  ),
  userInterests: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);

    // server-only: call the AI flow (this imports server-only libs)
    const highlights = await personalizeNewsForUser({
      articles: parsed.articles,
      userInterests: parsed.userInterests,
    });

    return NextResponse.json({ items: highlights }, { status: 200 });
  } catch (err: any) {
    console.error('API /api/ai/personalize error:', err);
    const message = err?.message ?? 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

    