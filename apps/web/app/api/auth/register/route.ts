
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { setSession } from '@/lib/auth';

const RegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  artistName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  region: z.string().optional(),
  genre: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.parse(body);

    const db = getDbClient();

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, validated.email));
    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user
    const [user] = await db.insert(users).values({
      email: validated.email,
      passwordHash,
      verified: false,
      role: 'user',
    }).returning();

    // Create profile
    await db.insert(profiles).values({
      userId: user.id,
      displayName: validated.artistName,
      bio: `${validated.firstName} ${validated.lastName}`,
    });

    // Set session
    await setSession({
      uid: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
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
