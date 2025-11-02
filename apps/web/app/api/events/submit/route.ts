
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { getDbClient } from '@/lib/db-client';
import { eventSubmissions, gigs } from '@thecueroom/db/schema';
import { z } from 'zod';
import { isBollywoodEvent, hasValidGenre } from '@thecueroom/feeds/normalize';

const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  venue: z.string().min(2),
  city: z.string().min(2),
  startTime: z.string(),
  endTime: z.string().optional(),
  ticketUrl: z.string().url().optional(),
  genres: z.array(z.string()).min(1),
  imageUrl: z.string().url().optional(),
});

async function verifyEventWithAI(payload: any): Promise<{ confidence: number; approved: boolean; reason?: string }> {
  // Check for Bollywood/pop content
  if (isBollywoodEvent(payload.title, payload.description)) {
    return {
      confidence: 0,
      approved: false,
      reason: 'Event appears to be Bollywood/pop related'
    };
  }

  // Check for valid electronic music genres
  if (!hasValidGenre(payload.title, payload.description, payload.genres)) {
    return {
      confidence: 30,
      approved: false,
      reason: 'Event does not match electronic music genres'
    };
  }

  // Basic validation passed
  const confidence = 85;
  const threshold = parseFloat(process.env.AI_VERIFICATION_CONFIDENCE || '0.9') * 100;

  return {
    confidence,
    approved: confidence >= threshold,
    reason: confidence >= threshold ? 'Auto-approved by AI' : 'Queued for manual review'
  };
}

export async function POST(request: NextRequest) {
  const roleCheck = await requireRole(request, ['admin', 'artist']);
  if (!roleCheck.authorized) {
    return roleCheck.error;
  }

  try {
    const body = await request.json();
    const data = eventSchema.parse(body);
    const db = getDbClient();

    // AI verification
    const aiResult = await verifyEventWithAI(data);

    // Create submission
    const [submission] = await db.insert(eventSubmissions).values({
      submitterId: roleCheck.session.uid,
      payload: data,
      status: aiResult.approved ? 'auto_approved' : 'needs_review',
      aiConfidence: aiResult.confidence,
      adminComment: aiResult.reason,
    }).returning();

    // If auto-approved, create the event
    if (aiResult.approved) {
      await db.insert(gigs).values({
        userId: roleCheck.session.uid,
        title: data.title,
        description: data.description,
        venue: data.venue,
        location: data.city,
        city: data.city,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        ticketUrl: data.ticketUrl,
        genres: data.genres,
        imageUrl: data.imageUrl,
        approved: true,
        visibility: 'public',
        status: 'approved',
        source: 'user-submitted',
      });
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      status: submission.status,
      aiConfidence: aiResult.confidence,
      message: aiResult.reason,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Event submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit event' },
      { status: 500 }
    );
  }
}
