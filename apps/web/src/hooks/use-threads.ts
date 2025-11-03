import { useState, useEffect, useCallback, useRef } from "react";
import { safeFetch } from "@/lib/safe-fetch";

interface Thread {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  userId: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  verified?: boolean;
  replyCount: number;
  likesCount: number;
  viewCount: number;
  isPinned: boolean;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseThreadsResult {
  data: Thread[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

const cache = new Map<string, { data: Thread[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export function useThreads(categoryId?: string): UseThreadsResult {
  const [data, setData] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cacheKey = `threads-${categoryId || "all"}`;

  const fetchThreads = useCallback(
    async (showLoading = true) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setData(cached.data);
        setLoading(false);
        // Background refresh
        if (showLoading === false) return;
      } else if (showLoading) {
        setLoading(true);
      }

      const url = categoryId
        ? `/api/forum/thread?categoryId=${categoryId}&limit=50`
        : `/api/forum/thread?limit=50`;

      const result = await safeFetch<{ threads: Thread[] }>(url, {
        signal: abortControllerRef.current.signal,
        timeout: 8000,
      });

      if (result.ok && result.data?.threads) {
        const threads = result.data.threads;
        setData(threads);
        setError(null);
        cache.set(cacheKey, { data: threads, timestamp: Date.now() });
        setHasMore(threads.length >= 50);
      } else {
        setError(result.error || "Failed to load threads");
      }

      setLoading(false);
    },
    [categoryId, cacheKey],
  );

  const refresh = useCallback(() => {
    cache.delete(cacheKey);
    fetchThreads(true);
  }, [cacheKey, fetchThreads]);

  const loadMore = useCallback(() => {
    // Placeholder for pagination
    console.log("[Forum] Load more threads");
  }, []);

  useEffect(() => {
    fetchThreads();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchThreads]);

  return { data, loading, error, refresh, loadMore, hasMore };
}
