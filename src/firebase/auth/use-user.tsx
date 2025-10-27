
'use client';

import { useAuth } from '@/lib/firebase/AuthProvider';

/**
 * A hook to get the current Firebase user object.
 *
 * This is a lightweight wrapper around the main `useAuth` context
 * to provide a direct and convenient way for components to access
 * the user state without needing to destructure the entire auth context.
 *
 * @returns The current user object from the auth context.
 */
export function useUser() {
  const { user } = useAuth();
  return { user };
}
