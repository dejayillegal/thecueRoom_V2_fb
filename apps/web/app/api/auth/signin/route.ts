import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSession } from '@/lib/auth';
import { getDbClient } from '@thecueroom/db/client';
import { loginAttempts, users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

const MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_POINTS || '5', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10) * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const now = new Date();
    const db = getDbClient();
    
    const record = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.identifier, identifier))
      .limit(1)
      .then(res => res[0]);

    if (!record) {
      await db.insert(loginAttempts).values({
        identifier,
        attempts: 1,
        lastAttemptAt: now,
      } as any).catch(err => console.error('Failed to insert login attempt:', err));
      return { allowed: true };
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfter };
    }

    const lastAttemptAt = record.lastAttemptAt instanceof Date ? record.lastAttemptAt : new Date(record.lastAttemptAt);
    const windowExpired = now.getTime() - lastAttemptAt.getTime() > WINDOW_MS;
    
    if (windowExpired) {
      await db.update(loginAttempts)
        .set({ attempts: 1, lastAttemptAt: now, blockedUntil: null } as any)
        .where(eq(loginAttempts.identifier, identifier))
        .catch(err => console.error('Failed to reset login attempts:', err));
      return { allowed: true };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
      await db.update(loginAttempts)
        .set({ blockedUntil } as any)
        .where(eq(loginAttempts.identifier, identifier))
        .catch(err => console.error('Failed to block user:', err));
      return { allowed: false, retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) };
    }

    await db.update(loginAttempts)
      .set({ 
        attempts: record.attempts + 1,
        lastAttemptAt: now,
      } as any)
      .where(eq(loginAttempts.identifier, identifier))
      .catch(err => console.error('Failed to increment login attempts:', err));

    return { allowed: true };
  } catch (err) {
    console.error('checkRateLimit runtime error:', err);
    return { allowed: true };
  }
}

async function recordSuccessfulLogin(identifier: string, userId: string): Promise<void> {
  try {
    const db = getDbClient();
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier)).catch(() => {});
    await db.update(users).set({ lastLoginAt: new Date() } as any).where(eq(users.id, userId as any)).catch(() => {});
  } catch (err) {
    console.error('recordSuccessfulLogin error:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    const emailLimit = await checkRateLimit(`email:${normalizedEmail}`);
    if (!emailLimit.allowed) {
      return NextResponse.json({ success: false, error: `Too many attempts. Try again in ${emailLimit.retryAfter}s.` }, { status: 429 });
    }

    const user = await authenticateUser(normalizedEmail, password);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    await recordSuccessfulLogin(`email:${normalizedEmail}`, user.uid);
    await setSession(user);

    return NextResponse.json({
      success: true,
      user: { uid: user.uid, email: user.email, role: user.role }
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}
