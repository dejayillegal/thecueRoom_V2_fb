
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs } from '@thecueroom/db/schema';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SubmitSchema = z.object({
  userId: z.string().uuid(),
  profileUrl: z.string().url(),
});

const ALLOWED_DOMAINS = [
  'soundcloud.com',
  'instagram.com',
  'bandcamp.com',
  'mixcloud.com',
  'spotify.com',
  'residentadvisor.net',
  'youtube.com',
  'beatport.com',
];

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ip) || [];
  const recentTimestamps = timestamps.filter(t => now - t < 3600000); // 1 hour
  
  if (recentTimestamps.length >= 3) {
    return false;
  }
  
  recentTimestamps.push(now);
  rateLimitStore.set(ip, recentTimestamps);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, message: 'Rate limit exceeded. Max 3 submissions per hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = SubmitSchema.parse(body);

    // Validate domain
    const url = new URL(validated.profileUrl);
    const isAllowed = ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain));
    
    if (!isAllowed) {
      return NextResponse.json(
        { ok: false, message: 'Profile URL must be from an allowed platform (SoundCloud, Instagram, Bandcamp, etc.)' },
        { status: 400 }
      );
    }

    const db = getDbClient();

    // Create verification job
    const [job] = await db.insert(verificationJobs).values({
      userId: validated.userId,
      profileUrl: validated.profileUrl,
      status: 'queued',
    }).returning();

    // Write to queue file for worker
    const queueDir = process.env.VERIFY_TEMP_DIR || '/tmp/thecueroom/verify';
    try {
      mkdirSync(queueDir, { recursive: true });
      const queueFile = join(queueDir, 'queue.jsonl');
      const queueEntry = JSON.stringify({ jobId: job.id, timestamp: Date.now() }) + '\n';
      writeFileSync(queueFile, queueEntry, { flag: 'a' });
    } catch (err) {
      console.error('Queue write error (non-fatal):', err);
    }

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      status: 'queued',
    });
  } catch (error: any) {
    console.error('Verification submit error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: error.message || 'Verification submission failed' },
      { status: 500 }
    );
  }
}
