import React, { useEffect, useRef, useCallback, DependencyList } from "react";

export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const getController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  return { getController, abortControllerRef };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, deps) as T;
}

export function createLazyLoader<T>(
  loader: () => Promise<T>,
  cacheTime: number = 5 * 60 * 1000,
) {
  let cache: { data: T; timestamp: number } | null = null;

  return async (): Promise<T> => {
    if (cache && Date.now() - cache.timestamp < cacheTime) {
      return cache.data;
    }

    const data = await loader();
    cache = { data, timestamp: Date.now() };
    return data;
  };
}

export class ResourceCleanup {
  private cleanupTasks: Array<() => void> = [];

  add(task: () => void) {
    this.cleanupTasks.push(task);
  }

  cleanup() {
    this.cleanupTasks.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    });
    this.cleanupTasks = [];
  }
}
