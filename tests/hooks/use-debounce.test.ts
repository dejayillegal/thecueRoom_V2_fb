import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../../apps/web/src/hooks/use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    expect(result.current).toBe('first');

    // Update the value
    rerender({ value: 'second', delay: 500 });
    
    // Value should still be 'first' before delay
    expect(result.current).toBe('first');

    // Fast-forward time
    vi.advanceTimersByTime(500);

    // Wait for the hook to update
    await waitFor(() => {
      expect(result.current).toBe('second');
    });
  });

  it('should cancel pending debounce on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    );

    // Rapid changes
    rerender({ value: 'second' });
    vi.advanceTimersByTime(200);
    
    rerender({ value: 'third' });
    vi.advanceTimersByTime(200);
    
    rerender({ value: 'fourth' });
    
    // Still showing initial value
    expect(result.current).toBe('first');

    // Fast-forward past the last delay
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      // Should only show the last value
      expect(result.current).toBe('fourth');
    });
  });

  it('should handle custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    // Wait less than delay
    vi.advanceTimersByTime(500);
    expect(result.current).toBe('initial');

    // Wait full delay
    vi.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should work with different value types', async () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value, 400),
      { initialProps: { value: 42 } }
    );

    expect(result.current).toBe(42);

    rerender({ value: 100 });
    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('should work with objects', async () => {
    const obj1 = { id: 1, name: 'Test' };
    const obj2 = { id: 2, name: 'Updated' };

    const { result, rerender } = renderHook(
      ({ value }: { value: typeof obj1 }) => useDebounce(value, 400),
      { initialProps: { value: obj1 } }
    );

    expect(result.current).toEqual(obj1);

    rerender({ value: obj2 });
    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(result.current).toEqual(obj2);
    });
  });
});
