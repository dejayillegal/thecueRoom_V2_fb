import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq, or } from 'drizzle-orm';
import { setSession } from '@/lib/auth';

const RegisterSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  username: z.string().trim().toLowerCase().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-z0-9]+$/, 'Username can only contain letters and numbers'),
  artistName: z.string().trim().min(1, 'Artist name is required'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=]/, 'Password must contain at least one special character'),
  region: z.string().trim().min(1).max(60),
  genre: z.string().trim().min(1).max(120),
  socialProfileUrl: z.string().url('Please provide a valid URL').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.parse(body);

    const db = getDbClient();

    const existing = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, validated.email),
          eq(users.username, validated.username)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].email === validated.email) {
        return NextResponse.json(
          { ok: false, message: 'Email already registered' },
          { status: 400 }
        );
      }
      if (existing[0].username === validated.username) {
        return NextResponse.json(
          { ok: false, message: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    const [user] = await db.insert(users).values({
      email: validated.email,
      username: validated.username,
      passwordHash,
      verified: false,
      verificationStatus: 'pending',
      role: 'user',
    }).returning();

    await db.insert(profiles).values({
      userId: user.id,
      firstName: validated.firstName,
      lastName: validated.lastName,
      displayName: validated.artistName,
      bio: `${validated.firstName} ${validated.lastName}`,
      region: validated.region,
      genre: validated.genre,
      socialProfileUrl: validated.socialProfileUrl || null,
    });

    await setSession({
      uid: user.id,
      email: user.email,
      role: user.role,
    });

    let verificationJobId: string | undefined;
    
    if (validated.socialProfileUrl) {
      try {
        const verifyUrl = new URL('/api/verify/submit', request.nextUrl.origin);
        const verifyRes = await fetch(verifyUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            profileUrl: validated.socialProfileUrl,
          }),
        });
        
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          verificationJobId = verifyData.jobId;
          
          await db
            .update(users)
            .set({ verificationJobId: verificationJobId })
            .where(eq(users.id, user.id));
        } else {
          console.error('Verification job creation failed:', await verifyRes.text());
        }
      } catch (verifyError) {
        console.error('Verification job creation error:', verifyError);
      }
    }

    return NextResponse.json({
      ok: true,
      userId: user.id,
      jobId: verificationJobId,
    });
  } catch (error: any) {
    console.error('Register error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}