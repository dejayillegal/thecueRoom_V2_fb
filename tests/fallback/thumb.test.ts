
```typescript
import { describe, it, expect } from 'vitest';
import { hashToIndex, getFallbackNumber } from '../../apps/web/src/lib/fallback-hash';
import { getFallbackUrl, getFallbackSrcSet } from '../../apps/web/src/lib/feed-image';

describe('Fallback Thumbnail System', () => {
  describe('hashToIndex', () => {
    it('should return consistent results for same input', () => {
      const id = 'test-article-123';
      const result1 = hashToIndex(id, 4);
      const result2 = hashToIndex(id, 4);
      expect(result1).toBe(result2);
    });

    it('should return values within bucket range', () => {
      const id = 'test-article-456';
      const result = hashToIndex(id, 4);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(4);
    });

    it('should distribute values across buckets', () => {
      const ids = Array.from({ length: 100 }, (_, i) => `article-${i}`);
      const results = ids.map(id => hashToIndex(id, 4));
      const distribution = [0, 0, 0, 0];
      results.forEach(r => distribution[r]++);
      
      // Each bucket should have at least some values
      distribution.forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('getFallbackNumber', () => {
    it('should return a number between 1 and 4', () => {
      const result = getFallbackNumber('test-article');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(4);
    });

    it('should be deterministic', () => {
      const id = 'consistent-test';
      const result1 = getFallbackNumber(id);
      const result2 = getFallbackNumber(id);
      expect(result1).toBe(result2);
    });
  });

  describe('getFallbackUrl', () => {
    it('should generate correct URL', () => {
      const url = getFallbackUrl('test-123');
      expect(url).toBe('/api/fallback-thumb/test-123');
    });

    it('should encode special characters in ID', () => {
      const url = getFallbackUrl('test/123?foo=bar');
      expect(url).toContain(encodeURIComponent('test/123?foo=bar'));
    });
  });

  describe('getFallbackSrcSet', () => {
    it('should generate srcset', () => {
      const srcset = getFallbackSrcSet('test-123');
      expect(srcset).toContain('1x');
      expect(srcset).toContain('2x');
    });
  });
});
```
