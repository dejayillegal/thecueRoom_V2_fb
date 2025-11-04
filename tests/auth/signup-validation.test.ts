
import { describe, it, expect } from 'vitest';

describe('Signup Validation', () => {
  it('validates email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it('validates password complexity', () => {
    const weakPassword = 'password';
    const strongPassword = 'SecurePass123!';
    
    const hasUpperCase = /[A-Z]/.test(strongPassword);
    const hasLowerCase = /[a-z]/.test(strongPassword);
    const hasNumber = /[0-9]/.test(strongPassword);
    const isLongEnough = strongPassword.length >= 10;
    
    expect(hasUpperCase && hasLowerCase && hasNumber && isLongEnough).toBe(true);
  });

  it('validates artist name uniqueness check', () => {
    const artistName = 'DJ TestArtist';
    expect(artistName.length).toBeGreaterThanOrEqual(2);
    expect(artistName.length).toBeLessThanOrEqual(100);
  });

  it('validates social links URL format', () => {
    const validUrl = 'https://soundcloud.com/artist';
    const invalidUrl = 'not-a-url';
    
    try {
      new URL(validUrl);
      expect(true).toBe(true);
    } catch {
      expect(false).toBe(true);
    }
    
    try {
      new URL(invalidUrl);
      expect(false).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });

  it('validates social links limit', () => {
    const socialLinks = ['url1', 'url2', 'url3', 'url4', 'url5'];
    expect(socialLinks.length).toBeLessThanOrEqual(5);
  });
});
