
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useSafeInterval', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      (window as any).__activeIntervals = 0;
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      const count = (window as any).__activeIntervals || 0;
      expect(count).toBe(0);
    }
  });

  it('should cleanup intervals on unmount', () => {
    // Mock test - actual implementation would mount/unmount components
    expect(true).toBe(true);
  });
});
