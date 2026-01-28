import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSession } from '@/lib/auth';
import { getDbClient } from '@thecueroom/db/client';
import { loginAttempts, users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

const MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_POINTS || '5', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10) * 1000; // convert to ms
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const now = new Date();
    const db = getDbClient();
    if (!db || !loginAttempts) {
      console.warn('Rate limit check: DB or table missing, failing open');
      return { allowed: true };
    }

    // Get or create rate limit record
    const record = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.identifier, identifier))
      .limit(1)
      .then(res => res[0]);

    if (!record) {
      // First attempt
      await db.insert(loginAttempts).values({
        identifier,
        attempts: 1,
        lastAttemptAt: now,
      } as any).catch(err => console.error('Failed to insert login attempt:', err));
      return { allowed: true };
    }

    // Check if blocked
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfter };
    }

    // Check if window expired
    const lastAttemptAt = record.lastAttemptAt instanceof Date ? record.lastAttemptAt : new Date(record.lastAttemptAt);
    const windowExpired = now.getTime() - lastAttemptAt.getTime() > WINDOW_MS;
    
    if (windowExpired) {
      // Reset counter
      await db.update(loginAttempts)
        .set({ attempts: 1, lastAttemptAt: now, blockedUntil: null })
        .where(eq(loginAttempts.identifier, identifier))
        .catch(err => console.error('Failed to reset login attempts:', err));
      return { allowed: true };
    }

    // Check if max attempts exceeded
    if (record.attempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
      await db.update(loginAttempts)
        .set({ blockedUntil })
        .where(eq(loginAttempts.identifier, identifier))
        .catch(err => console.error('Failed to block user:', err));
      return { allowed: false, retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) };
    }

    // Increment attempts
    await db.update(loginAttempts)
      .set({ 
        attempts: record.attempts + 1,
        lastAttemptAt: now,
      })
      .where(eq(loginAttempts.identifier, identifier))
      .catch(err => console.error('Failed to increment login attempts:', err));

    return { allowed: true };
  } catch (err) {
    console.error('checkRateLimit runtime error:', err);
    return { allowed: true }; // Fail open
  }
}

async function recordSuccessfulLogin(identifier: string, userId: string): Promise<void> {
  try {
    const db = getDbClient();
    if (!db || !loginAttempts || !users) return;
    
    // Clear rate limit on successful login
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier)).catch(() => {});
    // Update last login timestamp
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId)).catch(() => {});
  } catch (err) {
    console.error('recordSuccessfulLogin error:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    let email, password;
    
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Rate limit by email and IP
    const emailLimit = await checkRateLimit(`email:${normalizedEmail}`);
    const ipLimit = await checkRateLimit(`ip:${ip}`);

    if (!emailLimit.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: `Too many login attempts. Please try again in ${emailLimit.retryAfter} seconds.`,
          retryAfter: emailLimit.retryAfter,
          toast: {
            variant: 'destructive',
            title: 'Too Many Attempts',
            description: `Please wait ${emailLimit.retryAfter} seconds before trying again.`
          }
        },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfter) } }
      );
    }

    if (!ipLimit.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: `Too many login attempts from this IP. Please try again in ${ipLimit.retryAfter} seconds.`,
          retryAfter: ipLimit.retryAfter,
          toast: {
            variant: 'destructive',
            title: 'Too Many Attempts',
            description: `Please wait ${ipLimit.retryAfter} seconds before trying again.`
          }
        },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      );
    }

    const user = await authenticateUser(normalizedEmail, password);

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email or password',
          toast: {
            variant: 'destructive',
            title: 'Sign In Failed',
            description: 'Invalid email or password. Please try again.'
          }
        },
        { status: 401 }
      );
    }

    await recordSuccessfulLogin(`email:${normalizedEmail}`, user.uid);
    await recordSuccessfulLogin(`ip:${ip}`, user.uid);
    await setSession(user);

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      toast: {
        title: 'Welcome back!',
        description: `Signed in as ${user.email}`
      },
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}