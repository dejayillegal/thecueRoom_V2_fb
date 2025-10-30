
import { describe, it, expect } from 'vitest';
import { EPK_TEMPLATES } from '@/data/epk-templates';

describe('EPK Template Selector', () => {
  it('should have 16 templates', () => {
    expect(EPK_TEMPLATES.length).toBe(16);
  });

  it('should have valid template structure', () => {
    EPK_TEMPLATES.forEach(template => {
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('tag');
      expect(template).toHaveProperty('modules');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('thumbnailSvg');
      expect(template).toHaveProperty('colorScheme');
      
      expect(template.modules.length).toBeGreaterThan(0);
      expect(template.thumbnailSvg).toContain('<svg');
    });
  });

  it('should have all required categories', () => {
    const categories = [...new Set(EPK_TEMPLATES.map(t => t.category))];
    expect(categories).toContain('modern');
    expect(categories).toContain('minimalist');
    expect(categories).toContain('editorial');
  });

  it('should have unique IDs', () => {
    const ids = EPK_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
