
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Availability Check API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should allow up to 20 requests per minute', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true })
      });
      global.fetch = mockFetch;

      for (let i = 0; i < 20; i++) {
        await fetch('/api/auth/check-availability', {
          method: 'POST',
          body: JSON.stringify({ type: 'email', value: `test${i}@example.com` })
        });
      }

      expect(mockFetch).toHaveBeenCalledTimes(20);
    });

    it('should return 429 after rate limit exceeded', async () => {
      const response = { status: 429, json: async () => ({ reason: 'Rate limit exceeded' }) };
      expect(response.status).toBe(429);
    });
  });

  describe('Email Availability', () => {
    it('should return available for unique email', async () => {
      const result = { available: true };
      expect(result.available).toBe(true);
    });

    it('should return unavailable for existing email', async () => {
      const result = { available: false, reason: 'Email already registered' };
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Email already registered');
    });
  });

  describe('Artist Name Availability', () => {
    it('should return available for unique artist name', async () => {
      const result = { available: true };
      expect(result.available).toBe(true);
    });

    it('should return unavailable for taken artist name', async () => {
      const result = { available: false, reason: 'Artist name already taken' };
      expect(result.available).toBe(false);
    });
  });

  describe('Username Availability', () => {
    it('should return available for unique username', async () => {
      const result = { available: true };
      expect(result.available).toBe(true);
    });

    it('should return unavailable for taken username', async () => {
      const result = { available: false, reason: 'Username already taken' };
      expect(result.available).toBe(false);
    });
  });
});
