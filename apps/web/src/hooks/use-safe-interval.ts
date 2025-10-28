
import { useEffect, useRef } from 'react';

/**
 * Safe interval hook that automatically cleans up on unmount
 * @param callback - Function to call on interval
 * @param delay - Delay in milliseconds (null to pause)
 */
export function useSafeInterval(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
