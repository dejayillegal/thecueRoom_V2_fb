
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

const checkSchema = z.object({
  type: z.enum(['email', 'artist', 'username']),
  value: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { available: false, reason: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { available: false, reason: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { type, value } = checkSchema.parse(body);
    const db = getDbClient();

    if (type === 'email') {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, value.toLowerCase()))
        .limit(1);
      
      return NextResponse.json({
        available: existing.length === 0,
        reason: existing.length > 0 ? 'Email already registered' : undefined,
      });
    }

    if (type === 'artist') {
      const existing = await db
        .select()
        .from(profiles)
        .where(eq(profiles.artistName, value))
        .limit(1);
      
      return NextResponse.json({
        available: existing.length === 0,
        reason: existing.length > 0 ? 'Artist name already taken' : undefined,
      });
    }

    if (type === 'username') {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.username, value.toLowerCase()))
        .limit(1);
      
      return NextResponse.json({
        available: existing.length === 0,
        reason: existing.length > 0 ? 'Username already taken' : undefined,
      });
    }

    return NextResponse.json({ available: false, reason: 'Invalid type' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { available: false, reason: 'Invalid request', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Availability check error:', error);
    return NextResponse.json(
      { available: false, reason: 'Internal server error' },
      { status: 500 }
    );
  }
}
