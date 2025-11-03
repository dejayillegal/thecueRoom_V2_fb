"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AvailabilityResult {
  available: boolean | null;
  reason?: string;
  checking: boolean;
}

export function useAvailability(
  type: "email" | "artist" | "username",
  value: string,
  debounceMs: number = 400,
): AvailabilityResult {
  const [result, setResult] = useState<AvailabilityResult>({
    available: null,
    checking: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkAvailability = useCallback(
    async (val: string) => {
      if (!val || val.trim() === '') {
        setResult({ available: null, checking: false });
        return;
      }

      setResult({ available: null, checking: true });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value: val.trim() }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!controller.signal.aborted) {
          setResult({
            available: data.available,
            reason: data.reason,
            checking: false,
          });
        }
      } catch (error: any) {
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          setResult({ available: null, checking: false });
        }
      }
    },
    [type],
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!value) {
      setResult({ available: null, checking: false });
      return;
    }

    timeoutRef.current = setTimeout(() => {
      checkAvailability(value);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, debounceMs, checkAvailability]);

  return result;
}
