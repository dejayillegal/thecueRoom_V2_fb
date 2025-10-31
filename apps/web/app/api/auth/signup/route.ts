import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, verificationJobs } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  artistName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(10),
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  region: z.string().min(1).max(60),
  genre: z.string().min(1).max(120),
  socialLinks: z.array(z.string().url()).max(5).default([]),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function generateAutoUsername(artistName: string): string {
  const suffixes = ['sub', 'grid', 'void', 'flux', 'prime', 'edge', 'freq', 'rave', 'drift'];
  const normalized = artistName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
  
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const random = Math.random().toString(36).substring(2, 5);
  
  return `${normalized}.${suffix}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    const db = getDbClient();

    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    const existingArtistName = await db
      .select()
      .from(profiles)
      .where(eq(profiles.artistName, validated.artistName))
      .limit(1);

    if (existingArtistName.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Artist name already taken' },
        { status: 400 }
      );
    }

    const autoUsername = generateAutoUsername(validated.artistName);
    let uniqueUsername = autoUsername;
    let attempt = 0;
    
    while (attempt < 5) {
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, uniqueUsername))
        .limit(1);
      
      if (existingUsername.length === 0) break;
      uniqueUsername = generateAutoUsername(validated.artistName);
      attempt++;
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const [user] = await db
      .insert(users)
      .values({
        email: validated.email,
        username: uniqueUsername,
        passwordHash,
        verificationStatus: 'pending_ai',
        verified: false,
      })
      .returning();

    await db.insert(profiles).values({
      userId: user.id,
      artistName: validated.artistName,
      firstName: validated.firstName,
      lastName: validated.lastName,
      displayName: validated.artistName,
      region: validated.region,
      genre: validated.genre,
      socialLinks: validated.socialLinks.reduce((acc, link, idx) => {
        acc[`link${idx + 1}`] = link;
        return acc;
      }, {} as Record<string, string>),
    });

    const socialLinksForVerif = validated.socialLinks.length > 0 
      ? validated.socialLinks[0] 
      : `https://example.com/${uniqueUsername}`;

    const [verificationJob] = await db
      .insert(verificationJobs)
      .values({
        userId: user.id,
        profileUrl: socialLinksForVerif,
        status: 'queued',
        progress: 0,
      })
      .returning();

    await db
      .update(users)
      .set({ verificationJobId: verificationJob.id })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      ok: true,
      userId: user.id,
      jobId: verificationJob.id,
      username: uniqueUsername,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Signup error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}