import { describe, it, expect, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useSafeInterval } from '@/hooks/use-safe-interval';

describe('useSafeInterval', () => {
  it('should cleanup interval on unmount', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { unmount } = renderHook(() => useSafeInterval(callback, 1000));

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    cleanup();
    vi.useRealTimers();
  });
});