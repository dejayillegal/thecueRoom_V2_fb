
'use client';
import React, { useEffect } from 'react';
import useAuthState from '@/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';

/**
 * A client-side component that ensures a user is authenticated.
 * It waits for the auth state to be resolved before making a decision.
 *
 * This acts as a secondary, client-side guard. The primary guard is the
 * server-side check in the dashboard layout.
 */
export default function AuthRedirector({ fallback = '/' }: { fallback?: string }) {
  const { user, loading } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    // Wait until the auth state is fully resolved.
    if (loading) return;

    // If resolution completes and there's no user, redirect to the fallback URL.
    if (!user) {
      router.replace(fallback);
    }
  }, [user, loading, router, fallback]);

  // While loading, we can render a skeleton or nothing to prevent layout shifts.
  if (loading) {
    return (
        <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center">
            <div className="w-full max-w-md p-8">
                <Skeleton className="h-10 w-3/4 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        </div>
    );
  }

  // If there is a user, we don't need to render anything, the page content will show.
  // If there is no user, the useEffect will trigger the redirect.
  return null;
}
