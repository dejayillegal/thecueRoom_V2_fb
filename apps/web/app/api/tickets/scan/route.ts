import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { tickets } from '@thecueroom/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import crypto from 'crypto';

const db = getDbClient();

const scanSchema = z.object({
  ticketId: z.string(),
  signature: z.string(),
  eventSlug: z.string(),
});

function verifyTicketSignature(ticketId: string, eventSlug: string, signature: string): boolean {
  const secret = process.env.TICKET_SECRET;
  if (!secret) {
    throw new Error('TICKET_SECRET environment variable is not configured');
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${ticketId}:${eventSlug}`)
    .digest('hex');
  
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || (session.role !== 'admin' && session.role !== 'artist')) {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins and event organizers can scan tickets', valid: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = scanSchema.parse(body);

    const isValid = verifyTicketSignature(data.ticketId, data.eventSlug, data.signature);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid ticket signature', valid: false },
        { status: 400 }
      );
    }

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.ticketId, data.ticketId),
          eq(tickets.eventSlug, data.eventSlug)
        )
      )
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found', valid: false },
        { status: 404 }
      );
    }

    if (ticket.verified) {
      return NextResponse.json({
        valid: true,
        ticket: {
          id: ticket.id,
          ticketId: ticket.ticketId,
          holderName: ticket.holderName,
          holderEmail: ticket.holderEmail,
          seat: ticket.seat,
          issuedAt: ticket.issuedAt,
        },
        warning: 'Ticket already scanned',
        alreadyScanned: true,
      });
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set({ verified: true })
      .where(eq(tickets.id, ticket.id))
      .returning();

    return NextResponse.json({
      valid: true,
      ticket: {
        id: updatedTicket.id,
        ticketId: updatedTicket.ticketId,
        holderName: updatedTicket.holderName,
        holderEmail: updatedTicket.holderEmail,
        seat: updatedTicket.seat,
        issuedAt: updatedTicket.issuedAt,
      },
      message: 'Ticket verified successfully',
    });
  } catch (error) {
    console.error('Ticket scan error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors, valid: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to scan ticket', valid: false },
      { status: 500 }
    );
  }
}
