
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHmac } from 'crypto';
import QRCode from 'qrcode';

const createTicketSchema = z.object({
  eventSlug: z.string(),
  holderName: z.string().optional(),
  holderEmail: z.string().email().optional(),
  seat: z.string().optional(),
});

function generateHMAC(ticketId: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(ticketId)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTicketSchema.parse(body);

    const ticketId = `TCR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    const secret = process.env.TICKET_SECRET || 'default-secret-change-me';
    const signature = generateHMAC(ticketId, secret);

    // Generate QR code
    const qrData = JSON.stringify({
      ticketId,
      eventSlug: data.eventSlug,
      signature,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // In production, generate PDF with puppeteer and upload to storage
    // For now, return data URL
    const pdfUrl = qrCodeDataUrl; // Simplified for this implementation

    // Store in database
    // await db.insert(tickets).values({ ... });

    return NextResponse.json({
      ticketId,
      qrUrl: qrCodeDataUrl,
      pdfUrl,
      downloadUrl: `/api/tickets/download/${ticketId}`,
    }, { status: 201 });

  } catch (error) {
    console.error('Ticket creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
