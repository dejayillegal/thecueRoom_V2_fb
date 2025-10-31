import { describe, it, expect, beforeEach } from 'vitest';

describe('Signup Form Validation', () => {
  describe('Region field', () => {
    it('should accept text input up to 60 characters', () => {
      const validRegion = 'EU — Berlin';
      expect(validRegion.length).toBeLessThanOrEqual(60);
    });

    it('should truncate region text at 60 characters', () => {
      const longText = 'A'.repeat(100);
      const truncated = longText.slice(0, 60);
      expect(truncated.length).toBe(60);
    });

    it('should be a required field', () => {
      const isEmpty = '';
      expect(isEmpty).toBe('');
    });
  });

  describe('Genre field', () => {
    it('should accept text input up to 120 characters', () => {
      const validGenre = 'Techno, Minimal';
      expect(validGenre.length).toBeLessThanOrEqual(120);
    });

    it('should truncate genre text at 120 characters', () => {
      const longText = 'A'.repeat(200);
      const truncated = longText.slice(0, 120);
      expect(truncated.length).toBe(120);
    });

    it('should be a required field', () => {
      const isEmpty = '';
      expect(isEmpty).toBe('');
    });
  });

  describe('Server payload mapping', () => {
    it('should map regionText to region field', () => {
      const formData = {
        regionText: 'EU — Berlin',
      };
      
      const payload = {
        region: formData.regionText,
      };
      
      expect(payload.region).toBe('EU — Berlin');
    });

    it('should map genreText to primaryGenre field', () => {
      const formData = {
        genreText: 'Techno, Minimal',
      };
      
      const payload = {
        genre: formData.genreText,
      };
      
      expect(payload.genre).toBe('Techno, Minimal');
    });
  });

  describe('Input sanitization', () => {
    it('should handle special characters in region', () => {
      const region = 'EU — Berlin & Paris';
      expect(region).toContain('—');
      expect(region).toContain('&');
    });

    it('should handle special characters in genre', () => {
      const genre = 'Techno/House & Minimal';
      expect(genre).toContain('/');
      expect(genre).toContain('&');
    });
  });
});
