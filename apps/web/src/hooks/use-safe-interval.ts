
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
import { useEffect, useRef } from 'react';

// Global counter for test mode leak detection
let globalIntervalCount = 0;
export const getGlobalIntervalCount = () => globalIntervalCount;

export function useSafeInterval(
  callback: () => void,
  delay: number | null
) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    intervalRef.current = setInterval(() => savedCallback.current(), delay);
    
    if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
      globalIntervalCount++;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
          globalIntervalCount--;
        }
      }
    };
  }, [delay]);
}
