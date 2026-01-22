'use client';

import { useEffect } from 'react';

export default function LandingClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Phase 7: Polling via visibility events & traffic
    const triggerPolling = () => {
      // Small limit to keep it light
      fetch('/api/feeds?limit=1').catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Light conditional polling (every 15 mins while page is active)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        triggerPolling();
      }
    }, 15 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
