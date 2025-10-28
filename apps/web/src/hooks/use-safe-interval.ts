
import { useEffect, useRef } from 'react';

// Global counter for leak detection in TEST_MODE
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
  (window as any).__activeIntervals = 0;
}

export function useSafeInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
      (window as any).__activeIntervals++;
    }

    const id = setInterval(() => savedCallback.current(), delay);

    return () => {
      clearInterval(id);
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
        (window as any).__activeIntervals--;
      }
    };
  }, [delay]);
}
