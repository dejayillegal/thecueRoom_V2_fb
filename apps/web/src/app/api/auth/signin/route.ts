import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { users, authEvents } from '@/packages/db/schema';
import bcrypt from 'bcryptjs';
import { validateEmail } from '@/lib/validation/email';
import { eq } from 'drizzle-orm';

/**
 * Risk Scoring Engine (Phase 4)
 * Deterministic calculation based on identity signals.
 */
function calculateRiskScore(user: any, currentDeviceHash: string) {
  let risk = 0;

  // 1. Device Hash Drift
  if (user.lastDeviceHash && user.lastDeviceHash !== currentDeviceHash) {
    risk += 50;
  }

  // 2. Time Since Last Login (e.g., > 30 days)
  if (user.lastLoginAt) {
    const daysSince = (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) risk += 30;
  }

  return risk;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, deviceHash = 'unknown' } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Identity required' }, { status: 400 });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const normalizedEmail = emailValidation.normalized!;

    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Risk Calculation
    const riskScore = calculateRiskScore(user, deviceHash);
    const RISK_THRESHOLD = 40;

    // Log the event
    await db.insert(authEvents).values({
      userId: user.id,
      eventType: 'login',
      deviceHash,
      riskScore,
      metadata: { silent: riskScore <= RISK_THRESHOLD }
    });

    // Enforce Challenge if Risk > Threshold
    if (riskScore > RISK_THRESHOLD) {
      // In a real flow, this would trigger an email verification code
      // For this phase, we signal the requirement to the client
      return NextResponse.json({ 
        challengeRequired: true, 
        challengeType: 'email_otp',
        riskScore 
      }, { status: 200 });
    }

    // Silent Login (Low Risk)
    await db.update(users)
      .set({ 
        lastLoginAt: new Date(),
        lastDeviceHash: deviceHash,
        riskScore: riskScore
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Authentication service failure' }, { status: 500 });
  }
}
