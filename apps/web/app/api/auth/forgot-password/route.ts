import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestMap = new Map<string, { count: number; resetAt: number }>();
const pendingResets = new Map<string, { token: string; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestMap.get(ip);

  if (!record || now > record.resetAt) {
    requestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [email, data] of pendingResets.entries()) {
    if (now > data.expiresAt) {
      pendingResets.delete(email);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const db = getDbClient();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (user) {
      cleanupExpiredTokens();

      const resetToken = nanoid(32);
      const expiresAt = Date.now() + 60 * 60 * 1000;

      pendingResets.set(user.email, { token: resetToken, expiresAt });

      console.log(`[Security] Password reset requested for user ID: ${user.id.substring(0, 8)}...`);
      console.log(`[TODO] Email integration needed - Reset token generated (not logged for security)`);
      console.log(`[TODO] Send email to: ${user.email.substring(0, 3)}***@${user.email.split('@')[1]}`);
      console.log(`[TODO] Reset link format: /reset-password?token=<SECURE_TOKEN>`);
      console.log(`[TODO] Implement email service (Resend, SendGrid, AWS SES, etc.)`);
      console.log(`[TODO] Add resetToken and resetExpiry columns to users table schema for persistent storage`);
      console.log(`[TODO] Create /api/auth/reset-password endpoint to validate tokens and update passwords`);
    } else {
      console.log(`[Security] Password reset attempt for non-existent email: ${normalizedEmail.substring(0, 3)}***`);
    }

    return NextResponse.json({
      ok: true,
      message: 'If an account exists with that email, a password reset link has been sent'
    });
  } catch (error) {
    console.error('[Error] Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
