
'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

/**
 * A hook to get the current Firebase authentication state.
 *
 * This hook handles the initial loading state correctly, which is crucial
 * for client-side components to avoid rendering flashes of unauthenticated
 * content or making premature redirection decisions.
 *
 * @returns An object with the current user, loading state, and any auth error.
 */
export default function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to indicate initial check

  useEffect(() => {
    const auth = getAuth();
    
    // onAuthStateChanged returns an unsubscribe function that we use for cleanup.
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false); // Auth state is resolved, set loading to false.
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
