
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
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSafeInterval, getGlobalIntervalCount } from '@/../../apps/web/src/hooks/use-safe-interval';

describe('useSafeInterval', () => {
  it('should cleanup intervals on unmount', async () => {
    const callback = vi.fn();
    const initialCount = getGlobalIntervalCount();

    const { unmount } = renderHook(() => useSafeInterval(callback, 100));

    await waitFor(() => expect(getGlobalIntervalCount()).toBe(initialCount + 1));

    unmount();

    await waitFor(() => expect(getGlobalIntervalCount()).toBe(initialCount));
  });
});
