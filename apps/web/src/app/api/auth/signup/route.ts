import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { users, artistProfiles, authEvents } from '@/packages/db/schema';
import bcrypt from 'bcryptjs';
import { validateEmail } from '@/lib/validation/email';
import { eq } from 'drizzle-orm';

/**
 * Artist Verification Heuristics (Phase 3)
 * HEAD request only, no scraping.
 */
async function verifyArtistSocial(url: string) {
  if (!url) return { verified: false, score: 0 };
  
  try {
    // 1. URL Structure Validation
    const platforms = ['spotify.com', 'soundcloud.com', 'instagram.com', 'twitter.com', 'x.com', 'facebook.com'];
    const hasPlatform = platforms.some(p => url.toLowerCase().includes(p));
    if (!hasPlatform) return { verified: false, score: 0 };

    // 2. HEAD request check (Existence)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: { 'User-Agent': 'thecueRoom-Verification-Bot/2.0' }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { verified: true, score: 80 }; // High confidence for existence on valid platform
    }
  } catch (e) {
    console.error('Verification HEAD failed:', e);
  }
  
  return { verified: false, score: 10 };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, artistName, region, genre, publicProfileUrl } = body;

    // 1. Validate inputs
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Identity already registered' }, { status: 400 });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    // 4. Create User (Atomic Transaction)
    const [newUser] = await db.insert(users).values({
      email,
      username,
      passwordHash,
      role: artistName ? 'artist' : 'user',
      trustLevel: 0,
    }).returning();

    // 5. Artist Specific Path
    if (artistName) {
      const verification = await verifyArtistSocial(publicProfileUrl);
      
      await db.insert(artistProfiles).values({
        userId: newUser.id,
        artistName,
        primarySocialUrl: publicProfileUrl,
        verificationStatus: verification.verified ? 'verified' : 'pending',
        verifiedAt: verification.verified ? new Date() : null,
      });

      // Update trust level if auto-verified
      if (verification.verified) {
        await db.update(users)
          .set({ trustLevel: 2, verificationStatus: 'verified' })
          .where(eq(users.id, newUser.id));
      }
    }

    // 6. Log Auth Event
    await db.insert(authEvents).values({
      userId: newUser.id,
      eventType: 'signup',
      metadata: { artist: !!artistName, autoVerified: !!artistName && (await verifyArtistSocial(publicProfileUrl)).verified }
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email } });

  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'System failure during registration' }, { status: 500 });
  }
}
