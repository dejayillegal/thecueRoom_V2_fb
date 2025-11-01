
import { useState, useEffect, useCallback, useRef } from 'react';
import { safeFetch } from '@/lib/safe-fetch';
import { nanoid } from 'nanoid';

interface Reply {
  id: string;
  threadId: string;
  userId: string;
  body: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  likesCount: number;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected' | 'review';
}

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
  liked?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseThreadResult {
  thread: Thread | null;
  replies: Reply[];
  loading: boolean;
  error: string | null;
  postReply: (body: string) => Promise<void>;
  toggleLike: () => Promise<void>;
  refresh: () => void;
}

export function useThread(threadId: string): UseThreadResult {
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const likeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchThread = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    const result = await safeFetch<{ thread: Thread; replies: Reply[] }>(
      `/api/forum/thread/${threadId}`,
      {
        signal: abortControllerRef.current.signal,
        timeout: 8000,
      }
    );

    if (result.ok && result.data) {
      setThread(result.data.thread);
      setReplies(result.data.replies || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to load thread');
    }

    setLoading(false);
  }, [threadId]);

  const postReply = useCallback(async (body: string) => {
    if (!thread) return;

    const tempId = `temp-${nanoid()}`;
    const optimisticReply: Reply = {
      id: tempId,
      threadId: thread.id,
      userId: 'current-user',
      body,
      username: 'You',
      likesCount: 0,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // Optimistic update
    setReplies((prev) => [...prev, optimisticReply]);
    setThread((prev) => prev ? { ...prev, replyCount: prev.replyCount + 1 } : null);

    const result = await safeFetch<{ reply: Reply; status: string }>(
      `/api/forum/thread/${threadId}/reply`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
        timeout: 20000,
      }
    );

    if (result.ok && result.data?.reply) {
      setReplies((prev) =>
        prev.map((r) => (r.id === tempId ? result.data!.reply : r))
      );
      
      if (result.data.status === 'review') {
        setReplies((prev) =>
          prev.map((r) =>
            r.id === result.data!.reply.id ? { ...r, status: 'review' } : r
          )
        );
      }
    } else {
      // Revert on error
      setReplies((prev) => prev.filter((r) => r.id !== tempId));
      setThread((prev) => prev ? { ...prev, replyCount: prev.replyCount - 1 } : null);
      throw new Error(result.error || 'Failed to post reply');
    }
  }, [thread, threadId]);

  const toggleLike = useCallback(async () => {
    if (!thread) return;

    // Clear existing debounce
    if (likeDebounceRef.current) {
      clearTimeout(likeDebounceRef.current);
    }

    // Optimistic update
    const wasLiked = thread.liked || false;
    const newLikesCount = wasLiked ? thread.likesCount - 1 : thread.likesCount + 1;

    setThread((prev) =>
      prev ? { ...prev, liked: !wasLiked, likesCount: newLikesCount } : null
    );

    // Debounced API call
    likeDebounceRef.current = setTimeout(async () => {
      const result = await safeFetch<{ liked: boolean; likesCount: number }>(
        `/api/forum/thread/${threadId}/like`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      if (result.ok && result.data) {
        setThread((prev) =>
          prev
            ? {
                ...prev,
                liked: result.data!.liked,
                likesCount: result.data!.likesCount,
              }
            : null
        );
      } else {
        // Revert on error
        setThread((prev) =>
          prev ? { ...prev, liked: wasLiked, likesCount: thread.likesCount } : null
        );
      }
    }, 200);
  }, [thread, threadId]);

  const refresh = useCallback(() => {
    fetchThread();
  }, [fetchThread]);

  useEffect(() => {
    fetchThread();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (likeDebounceRef.current) {
        clearTimeout(likeDebounceRef.current);
      }
    };
  }, [fetchThread]);

  return { thread, replies, loading, error, postReply, toggleLike, refresh };
}
