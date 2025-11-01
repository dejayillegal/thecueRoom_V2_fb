
import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

const PENDING_FILE = './.local/gigs/events_pending.json';
const VERIFY_QUEUE = './.local/gigs/verify_queue.jsonl';

async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) return null;
    
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    return session.userId || session.uid || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.date || !body.venue) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, venue' },
        { status: 400 }
      );
    }
    
    const eventId = uuidv4();
    const event = {
      id: eventId,
      userId,
      title: body.title,
      artist: body.artist,
      date: new Date(body.date),
      venue: body.venue,
      address: body.address,
      region: body.region,
      genre: body.genre,
      ticketType: body.ticketType || 'rsvp',
      ticketUrl: body.ticketUrl,
      imageUrl: body.imageUrl,
      description: body.description,
      status: 'pending',
      createdAt: new Date(),
      verificationJobId: null
    };
    
    // Ensure directory exists
    const dir = join('./.local/gigs');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Save to pending
    let pending = [];
    if (existsSync(PENDING_FILE)) {
      pending = JSON.parse(readFileSync(PENDING_FILE, 'utf-8'));
    }
    pending.push(event);
    writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
    
    // Queue verification job
    const jobId = `verify-${eventId}`;
    const job = {
      jobId,
      eventId,
      type: 'verifyEvent',
      payload: event,
      status: 'queued',
      createdAt: new Date()
    };
    
    writeFileSync(VERIFY_QUEUE, JSON.stringify(job) + '\n', { flag: 'a' });
    
    event.verificationJobId = jobId;
    
    return NextResponse.json({
      success: true,
      eventId,
      verificationJobId: jobId,
      status: 'pending_verification'
    });
  } catch (error: any) {
    console.error('Event submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit event', details: error.message },
      { status: 500 }
    );
  }
}
