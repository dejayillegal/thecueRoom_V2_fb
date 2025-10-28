import { useEffect, useRef } from 'react';

export function useSafeInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    intervalRef.current = setInterval(() => savedCallback.current(), delay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [delay]);
}