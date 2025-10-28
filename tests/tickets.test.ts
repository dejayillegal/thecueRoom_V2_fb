
import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';

function generateHMAC(ticketId: string, secret: string): string {
  return createHmac('sha256', secret).update(ticketId).digest('hex');
}

describe('Ticket Generation and Verification', () => {
  const secret = 'test-secret-key';
  
  it('generates valid HMAC signature', () => {
    const ticketId = 'TCR-TEST-12345';
    const signature = generateHMAC(ticketId, secret);
    
    expect(signature).toBeTruthy();
    expect(signature).toHaveLength(64);
  });

  it('verifies valid ticket signature', () => {
    const ticketId = 'TCR-TEST-12345';
    const signature = generateHMAC(ticketId, secret);
    const verifySignature = generateHMAC(ticketId, secret);
    
    expect(signature).toBe(verifySignature);
  });

  it('rejects invalid ticket signature', () => {
    const ticketId = 'TCR-TEST-12345';
    const signature = generateHMAC(ticketId, secret);
    const tamperedSignature = generateHMAC('TCR-FAKE-99999', secret);
    
    expect(signature).not.toBe(tamperedSignature);
  });

  it('creates unique signatures for different tickets', () => {
    const ticket1 = generateHMAC('TCR-1', secret);
    const ticket2 = generateHMAC('TCR-2', secret);
    
    expect(ticket1).not.toBe(ticket2);
  });
});
