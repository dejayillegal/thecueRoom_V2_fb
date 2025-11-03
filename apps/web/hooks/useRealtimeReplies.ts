
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Reply {
  id: string;
  threadId: string;
  body: string;
  userId: string;
  likesCount: number;
  createdAt: string;
}

export function useRealtimeReplies(threadId: string, initialReplies: Reply[]) {
  const [replies, setReplies] = useState<Reply[]>(initialReplies);

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`replies:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_replies',
          filter: `threadId=eq.${threadId}`,
        },
        (payload) => {
          setReplies((prev) => [...prev, payload.new as Reply]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_replies',
          filter: `threadId=eq.${threadId}`,
        },
        (payload) => {
          setReplies((prev) =>
            prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  return replies;
}
