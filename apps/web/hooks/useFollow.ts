'use client';

import { useState, useCallback, useEffect } from 'react';

// Shared state for all follow buttons to stay in sync
const followListeners = new Set<(username: string, isFollowing: boolean) => void>();

export function useFollow(initialIsFollowing: boolean, username: string) {
  const [isFollowing, setIsFollowingState] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const listener = (updatedUsername: string, updatedIsFollowing: boolean) => {
      if (updatedUsername === username) {
        setIsFollowingState(updatedIsFollowing);
      }
    };
    followListeners.add(listener);
    return () => {
      followListeners.delete(listener);
    };
  }, [username]);

  const toggleFollow = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const shouldFollow = !isFollowing;
    const method = shouldFollow ? 'POST' : 'DELETE';

    try {
      const response = await fetch('/api/artist/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername: username }),
      });

      if (response.ok) {
        setIsFollowingState(shouldFollow);
        // Notify all other hooks about the change
        followListeners.forEach(listener => listener(username, shouldFollow));
        
        // Dispatch global event for non-hook listeners
        window.dispatchEvent(new CustomEvent('follow-change', { 
          detail: { username, isFollowing: shouldFollow } 
        }));
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isFollowing, username, isLoading]);

  return { isFollowing, isLoading, toggleFollow };
}
