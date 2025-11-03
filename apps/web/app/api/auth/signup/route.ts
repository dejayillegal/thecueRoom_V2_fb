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

const artistProfileSchema = z.object({
  profileUrl: z.string().url('Invalid profile URL'),
  genre: z.string().min(1, 'Genre is required').max(120),
  socialLinks: z.array(z.string().url()).max(4).default([]),
  techRider: z.any().nullable().optional(),
});

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters').regex(/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/, 'Password must include a number or special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional(),
  isArtist: z.boolean().default(false),
  artistName: z.string().min(2).max(100).optional(),
  artistProfile: artistProfileSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If isArtist is true, require artist fields
  if (data.isArtist) {
    return !!(data.artistName && data.artistProfile?.profileUrl && data.artistProfile?.genre);
  }
  return true;
}, {
  message: "Artist fields are required when signing up as an artist",
  path: ["isArtist"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Validate profile URL domain (only for artists)
    if (validatedData.isArtist && validatedData.artistProfile?.profileUrl) {
      const profileUrlObj = new URL(validatedData.artistProfile.profileUrl);
      const isAllowedDomain = ALLOWED_PROFILE_DOMAINS.some(domain => 
        profileUrlObj.hostname.includes(domain)
      );
      
      if (!isAllowedDomain) {
        return NextResponse.json(
          { ok: false, error: 'Profile URL must be from an allowed music platform' },
          { status: 400 }
        );
      }
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

    // Generate username for non-artists or use provided username for artists
    let finalUsername = validatedData.username;
    if (!validatedData.isArtist) {
      // Generate username from email for non-artists
      const emailPrefix = validatedData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      finalUsername = `${emailPrefix}_${randomSuffix}`;
    }

    // Check if username already exists
    if (finalUsername) {
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, finalUsername.toLowerCase()))
        .limit(1);

      if (existingUsername.length > 0) {
        return NextResponse.json(
          { ok: false, error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate profile URLs (only for artists)
    if (validatedData.isArtist && validatedData.profileUrl) {
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
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user with appropriate role
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email.toLowerCase(),
        username: finalUsername?.toLowerCase() || validatedData.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: validatedData.isArtist ? 'artist' : 'user',
        verified: false,
        verificationStatus: validatedData.isArtist ? 'verification_pending' : 'active',
      })
      .returning();

    // Create profile
    const socialLinksObj = validatedData.artistProfile?.socialLinks.reduce((acc, link, index) => {
      if (link) acc[`link${index + 1}`] = link;
      return acc;
    }, {} as Record<string, string>) || {};

    await db.insert(profiles).values({
      userId: newUser.id,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      artistName: validatedData.isArtist ? validatedData.artistName : null,
      region: null,
      genre: validatedData.artistProfile?.genre || null,
      socialProfileUrl: validatedData.isArtist ? validatedData.artistProfile?.profileUrl : null,
      socialLinks: socialLinksObj,
      bio: null,
    });

    // Create verification job for AI-based profile verification (only for artists)
    let verificationJobId: string | null = null;
    if (validatedData.isArtist && validatedData.artistProfile?.profileUrl) {
      const [job] = await db
        .insert(verificationJobs)
        .values({
          userId: newUser.id,
          profileUrl: validatedData.artistProfile.profileUrl,
          status: 'queued',
          progress: 0,
        })
        .returning();
      
      verificationJobId = job.id;
      
      // Update user with verification job ID
      await db.update(users)
        .set({ verificationJobId: job.id })
        .where(eq(users.id, newUser.id));
    }

    return NextResponse.json({
      ok: true,
      userId: newUser.id,
      jobId: verificationJobId,
      verificationJobId,
      role: newUser.role,
      message: validatedData.isArtist 
        ? 'Artist account created. Your profile is being verified.'
        : 'Account created successfully.',
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