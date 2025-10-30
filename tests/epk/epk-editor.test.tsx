
import { describe, it, expect } from 'vitest';
import { deterministicRewrite } from '@/lib/epk/rewrite-fallback';

describe('EPK Editor - AI Rewrite Fallback', () => {
  it('should generate structured output', () => {
    const input = 'Electronic music artist with 5 years of experience. Performed at major venues.';
    const result = deterministicRewrite(input, 'press');

    expect(result).toHaveProperty('tagline');
    expect(result).toHaveProperty('blurb');
    expect(result).toHaveProperty('epk_bio');
    
    expect(result.tagline).toBeTruthy();
    expect(result.blurb.length).toBeGreaterThanOrEqual(90);
    expect(result.blurb.length).toBeLessThanOrEqual(160);
    expect(result.epk_bio.length).toBeGreaterThanOrEqual(250);
  });

  it('should respect different tones', () => {
    const input = 'DJ and producer specializing in techno.';

    const pressResult = deterministicRewrite(input, 'press');
    const promoResult = deterministicRewrite(input, 'promotional');
    
    expect(pressResult.epk_bio).not.toBe(promoResult.epk_bio);
  });

  it('should extract genres correctly', () => {
    const input = 'Techno and house producer with a unique minimal sound.';
    const result = deterministicRewrite(input, 'technical');

    expect(result.epk_bio.toLowerCase()).toMatch(/techno|house|minimal/);
  });
});
