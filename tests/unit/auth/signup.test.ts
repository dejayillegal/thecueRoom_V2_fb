
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateSignupData, checkUsernameAvailability, checkEmailAvailability } from '@/lib/validation/signup';

describe('Signup Validation', () => {
  describe('validateSignupData', () => {
    it('should validate correct user signup data', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'SecurePass123!',
        role: 'user' as const,
      };

      const result = validateSignupData(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        displayName: 'Test User',
        password: 'SecurePass123!',
        role: 'user' as const,
      };

      const result = validateSignupData(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password: '123',
        role: 'user' as const,
      };

      const result = validateSignupData(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require artist fields for artist role', () => {
      const invalidData = {
        email: 'artist@example.com',
        username: 'artistuser',
        displayName: 'Artist User',
        password: 'SecurePass123!',
        role: 'artist' as const,
      };

      const result = validateSignupData(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return true for available username', async () => {
      const available = await checkUsernameAvailability('newuser123');
      expect(available).toBe(true);
    });

    it('should return false for taken username', async () => {
      const available = await checkUsernameAvailability('admin');
      expect(available).toBe(false);
    });
  });
});
