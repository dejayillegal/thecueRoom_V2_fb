
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function generateHMAC(ticketId: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(ticketId)
    .digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const signature = searchParams.get('signature');

    if (!ticketId || !signature) {
      return NextResponse.json(
        { valid: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    const secret = process.env.TICKET_SECRET || 'default-secret-change-me';
    const expectedSignature = generateHMAC(ticketId, secret);

    const isValid = signature === expectedSignature;

    return NextResponse.json({
      valid: isValid,
      ticketId: isValid ? ticketId : undefined,
    });

  } catch (error) {
    console.error('Ticket verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
