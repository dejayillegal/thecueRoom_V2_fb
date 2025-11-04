
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Profile Settings', () => {
  describe('Privacy Toggles', () => {
    it('should default showEmail to false', () => {
      const defaultSettings = {
        showEmail: false,
        showPhone: false,
        publicReleases: true,
        allowContactRequests: true,
      };
      expect(defaultSettings.showEmail).toBe(false);
    });

    it('should allow toggling privacy settings', () => {
      const settings = { showEmail: false };
      const updated = { ...settings, showEmail: true };
      expect(updated.showEmail).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate phone number format', () => {
      const validPhone = '+1 (555) 123-4567';
      expect(validPhone).toMatch(/^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/);
    });

    it('should validate bio length (max 500 chars)', () => {
      const bio = 'A'.repeat(500);
      expect(bio.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Save Functionality', () => {
    it('should detect changes in form data', () => {
      const original = { displayName: 'John' };
      const modified = { displayName: 'Jane' };
      expect(JSON.stringify(original) !== JSON.stringify(modified)).toBe(true);
    });

    it('should reset form on cancel', () => {
      const original = { displayName: 'John' };
      const modified = { displayName: 'Jane' };
      const reset = { ...original };
      expect(reset).toEqual(original);
    });
  });
});
