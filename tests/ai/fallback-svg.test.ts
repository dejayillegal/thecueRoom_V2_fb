import { describe, it, expect } from 'vitest';
import { generateFallbackSVG, getRandomPreset, PRESET_METADATA, type SVGPreset } from '../../packages/ai/impl/fallback-svg';

describe('Fallback SVG Generator', () => {
  const presets: SVGPreset[] = [
    'neon-accent',
    'monochrome',
    'geometric',
    'brutalist',
    'cybergrind',
    'vaporwave',
    'chromatic-grid',
    'noir-light',
    'acid-geometry',
    'liquid-metal',
  ];

  describe('generateFallbackSVG', () => {
    it('should generate valid SVG for all presets', () => {
      presets.forEach((preset) => {
        const svg = generateFallbackSVG({
          preset,
          artist: 'Test Artist',
          release: 'Test Release',
          seed: 12345,
        });

        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('viewBox="0 0 1024 1024"');
      });
    });

    it('should include artist and release text when provided', () => {
      const svg = generateFallbackSVG({
        preset: 'neon-accent',
        artist: 'DJ Test',
        release: 'Test Album',
        seed: 42,
      });

      expect(svg).toContain('DJ Test');
      expect(svg).toContain('Test Album');
    });

    it('should generate different output with different seeds', () => {
      const svg1 = generateFallbackSVG({
        preset: 'geometric',
        seed: 100,
      });

      const svg2 = generateFallbackSVG({
        preset: 'geometric',
        seed: 200,
      });

      expect(svg1).not.toEqual(svg2);
    });

    it('should generate consistent output with same seed', () => {
      const svg1 = generateFallbackSVG({
        preset: 'vaporwave',
        seed: 123,
        artist: 'Same',
      });

      const svg2 = generateFallbackSVG({
        preset: 'vaporwave',
        seed: 123,
        artist: 'Same',
      });

      expect(svg1).toEqual(svg2);
    });

    it('should handle special characters in artist/release names', () => {
      const svg = generateFallbackSVG({
        preset: 'brutalist',
        artist: 'Test & Co.',
        release: '<Release> "Name"',
        seed: 999,
      });

      expect(svg).toContain('&amp;');
      expect(svg).toContain('&lt;');
      expect(svg).toContain('&quot;');
    });

    it('should generate valid SVG without artist or release', () => {
      const svg = generateFallbackSVG({
        preset: 'monochrome',
        seed: 555,
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg.length).toBeGreaterThan(100);
    });
  });

  describe('getRandomPreset', () => {
    it('should return a valid preset', () => {
      const preset = getRandomPreset();
      expect(presets).toContain(preset);
    });

    it('should return different presets over multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(getRandomPreset());
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('PRESET_METADATA', () => {
    it('should have metadata for all presets', () => {
      presets.forEach((preset) => {
        expect(PRESET_METADATA[preset]).toBeDefined();
        expect(PRESET_METADATA[preset].name).toBeTruthy();
        expect(PRESET_METADATA[preset].description).toBeTruthy();
      });
    });

    it('should have unique names for all presets', () => {
      const names = presets.map(p => PRESET_METADATA[p].name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Performance', () => {
    it('should generate SVG quickly', () => {
      const start = Date.now();
      generateFallbackSVG({
        preset: 'neon-accent',
        artist: 'Speed Test',
        release: 'Performance',
        seed: 789,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('SVG Structure', () => {
    it('should include defs section for gradients and filters', () => {
      presets.forEach((preset) => {
        const svg = generateFallbackSVG({ preset, seed: 111 });
        expect(svg).toContain('<defs>');
        expect(svg).toContain('</defs>');
      });
    });

    it('should use proper SVG elements', () => {
      const svg = generateFallbackSVG({
        preset: 'geometric',
        seed: 222,
      });

      const hasValidElements = 
        svg.includes('<rect') ||
        svg.includes('<circle') ||
        svg.includes('<polygon') ||
        svg.includes('<path') ||
        svg.includes('<line');

      expect(hasValidElements).toBe(true);
    });
  });
});
