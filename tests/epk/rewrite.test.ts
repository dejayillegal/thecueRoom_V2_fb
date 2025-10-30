import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deterministicRewrite } from '@/lib/epk/rewrite-fallback';

describe('EPK Rewrite - Deterministic Fallback', () => {
  it('should generate structured output with all required fields', () => {
    const input = 'Electronic music artist with 5 years of experience. Performed at major venues including Fabric and Berghain.';
    const result = deterministicRewrite(input, 'press');

    expect(result).toHaveProperty('tagline');
    expect(result).toHaveProperty('blurb');
    expect(result).toHaveProperty('epk_bio');
    
    expect(result.tagline).toBeTruthy();
    expect(result.blurb).toBeTruthy();
    expect(result.epk_bio).toBeTruthy();
  });

  it('should respect length constraints', () => {
    const input = 'DJ and producer specializing in techno and house music. Known for energetic performances and technical skill.';
    const result = deterministicRewrite(input, 'concise');

    expect(result.tagline.length).toBeLessThanOrEqual(80);
    expect(result.blurb.length).toBeGreaterThanOrEqual(90);
    expect(result.blurb.length).toBeLessThanOrEqual(160);
    expect(result.epk_bio.length).toBeGreaterThanOrEqual(250);
    expect(result.epk_bio.length).toBeLessThanOrEqual(550);
  });

  it('should extract genres from bio text', () => {
    const input = 'Techno and house producer with a unique minimal sound.';
    const result = deterministicRewrite(input, 'technical');

    expect(result.epk_bio.toLowerCase()).toMatch(/techno|house|minimal/);
  });

  it('should handle different tones', () => {
    const input = 'Experienced DJ with a passion for underground music.';

    const pressResult = deterministicRewrite(input, 'press');
    const promoResult = deterministicRewrite(input, 'promotional');
    const conciseResult = deterministicRewrite(input, 'concise');
    const technicalResult = deterministicRewrite(input, 'technical');

    expect(pressResult.tagline).not.toBe(promoResult.tagline);
    expect(conciseResult.epk_bio).not.toBe(technicalResult.epk_bio);
  });

  it('should handle empty input gracefully', () => {
    const result = deterministicRewrite('', 'press');

    expect(result.tagline).toBe('Electronic Music Artist');
    expect(result.blurb).toBeTruthy();
    expect(result.epk_bio).toBeTruthy();
  });

  it('should parse and include venue names', () => {
    const input = 'Performed at Berghain and Fabric. Appeared at Movement Festival.';
    const result = deterministicRewrite(input, 'press');

    const hasVenue = result.epk_bio.includes('Berghain') || 
                     result.epk_bio.includes('Fabric') ||
                     result.epk_bio.includes('Movement');
    
    expect(hasVenue).toBe(true);
  });

  it('should extract and incorporate experience years', () => {
    const input = 'Producer with 10 years of experience in electronic music.';
    const result = deterministicRewrite(input, 'technical');

    expect(result.epk_bio).toMatch(/10 years|experience/i);
  });

  it('should apply synonyms for variety', () => {
    const input = 'Artist performs music at shows with unique energy.';
    const result1 = deterministicRewrite(input, 'press');
    const result2 = deterministicRewrite(input, 'press');

    expect(result1.epk_bio).toBeTruthy();
    expect(result2.epk_bio).toBeTruthy();
  });
});

describe('EPK Rewrite - API Response Format', () => {
  it('should match expected API response structure', () => {
    const result = deterministicRewrite('Test artist bio', 'press');

    const apiResponse = {
      ok: true,
      source: 'fallback' as const,
      outputs: result
    };

    expect(apiResponse).toHaveProperty('ok', true);
    expect(apiResponse).toHaveProperty('source', 'fallback');
    expect(apiResponse.outputs).toHaveProperty('tagline');
    expect(apiResponse.outputs).toHaveProperty('blurb');
    expect(apiResponse.outputs).toHaveProperty('epk_bio');
  });
});

describe('EPK Rewrite - Sanitization', () => {
  it('should sanitize HTML entities', async () => {
    const { sanitizeForHTML } = await import('@/lib/epk/rewrite-fallback');
    
    const dangerous = '<script>alert("xss")</script> & "quotes"';
    const safe = sanitizeForHTML(dangerous);

    expect(safe).not.toContain('<script>');
    expect(safe).toContain('&lt;');
    expect(safe).toContain('&gt;');
    expect(safe).toContain('&amp;');
    expect(safe).toContain('&quot;');
  });

  it('should truncate text correctly', async () => {
    const { truncate } = await import('@/lib/epk/rewrite-fallback');
    
    const longText = 'a'.repeat(200);
    const truncated = truncate(longText, 100);

    expect(truncated.length).toBe(100);
    expect(truncated).toMatch(/\.\.\.$/);
  });
});

describe('EPK Rewrite - Integration Scenarios', () => {
  it('should handle press tone for media kit', () => {
    const input = 'DJ Sarah has been making waves in the techno scene. Her performances at Berlin clubs have garnered critical acclaim.';
    const result = deterministicRewrite(input, 'press');

    expect(result.tagline).toMatch(/techno|artist|acclaimed/i);
    expect(result.epk_bio).toMatch(/berlin/i);
  });

  it('should create concise output for social media', () => {
    const input = 'Progressive house producer from London with releases on major labels.';
    const result = deterministicRewrite(input, 'concise');

    expect(result.blurb.length).toBeLessThanOrEqual(160);
    expect(result.blurb).toMatch(/house|london|producer/i);
  });

  it('should generate promotional copy', () => {
    const input = 'Resident DJ at Club X, known for marathon sets and crowd connection.';
    const result = deterministicRewrite(input, 'promotional');

    expect(result.tagline.toLowerCase()).toMatch(/electrifying|experience/);
  });

  it('should provide technical details', () => {
    const input = 'Multi-genre electronic artist specializing in ambient, techno, and bass music production.';
    const result = deterministicRewrite(input, 'technical');

    expect(result.epk_bio).toMatch(/ambient|techno|bass/i);
    expect(result.epk_bio.toLowerCase()).toMatch(/experienced|specialist/);
  });
});
