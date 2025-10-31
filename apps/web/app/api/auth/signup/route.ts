import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, verificationJobs } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const ALLOWED_PROFILE_DOMAINS = [
  'soundcloud.com',
  'bandcamp.com',
  'spotify.com',
  'mixcloud.com',
  'residentadvisor.net',
  'beatport.com',
  'instagram.com',
  'youtube.com',
];

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  artistName: z.string().min(2, 'Artist name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters').regex(/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/, 'Password must include a number or special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  region: z.string().min(1, 'Region is required').max(60),
  genre: z.string().min(1, 'Genre is required').max(120),
  profileUrl: z.string().url('Invalid profile URL'),
  socialLinks: z.array(z.string().url()).max(5).default([]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Validate profile URL domain
    const profileUrlObj = new URL(validatedData.profileUrl);
    const isAllowedDomain = ALLOWED_PROFILE_DOMAINS.some(domain => 
      profileUrlObj.hostname.includes(domain)
    );
    
    if (!isAllowedDomain) {
      return NextResponse.json(
        { ok: false, error: 'Profile URL must be from a recognized music platform' },
        { status: 400 }
      );
    }

    const db = getDbClient();

    // Check if email already exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email.toLowerCase()))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, validatedData.username.toLowerCase()))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Check for duplicate profile URLs
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.socialProfileUrl, validatedData.profileUrl))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'This profile URL is already registered by another user' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email.toLowerCase(),
        username: validatedData.username.toLowerCase(),
        passwordHash: hashedPassword,
        verified: false,
      })
      .returning();

    // Create profile
    const socialLinksObj = validatedData.socialLinks.reduce((acc, link, index) => {
      if (link) acc[`link${index + 1}`] = link;
      return acc;
    }, {} as Record<string, string>);

    await db.insert(profiles).values({
      userId: newUser.id,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      artistName: validatedData.artistName,
      region: validatedData.region,
      genre: validatedData.genre,
      socialProfileUrl: validatedData.profileUrl,
      socialLinks: socialLinksObj,
    });

    // Create verification job for AI-based profile verification
    // This will check if the profile URL is legitimate, matches the artist name,
    // and is not a fake/duplicate account
    const [job] = await db
      .insert(verificationJobs)
      .values({
        userId: newUser.id,
        profileUrl: validatedData.profileUrl,
        status: 'queued',
        metadata: {
          artistName: validatedData.artistName,
          email: validatedData.email,
          region: validatedData.region,
          genre: validatedData.genre,
        },
      })
      .returning();

    return NextResponse.json({
      ok: true,
      userId: newUser.id,
      jobId: job.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation failed', errors: error.errors },
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