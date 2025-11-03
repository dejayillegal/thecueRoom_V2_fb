
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Thread {
  id: string;
  likesCount: number;
  viewCount: number;
  replyCount: number;
}

export function useRealtimeThread(threadId: string, initialThread: Thread | null) {
  const [thread, setThread] = useState<Thread | null>(initialThread);

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_threads',
          filter: `id=eq.${threadId}`,
        },
        (payload) => {
          setThread((prev) => ({
            ...prev,
            ...(payload.new as Thread),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  return thread;
}
