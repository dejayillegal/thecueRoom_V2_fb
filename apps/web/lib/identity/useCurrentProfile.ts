import { useState, useEffect } from 'react';
import { resolveAvatar } from './avatarResolver';

export interface Profile {
  id: string;
  username: string;
  artistName: string;
  role: 'admin' | 'verified' | 'artist' | 'user';
  avatarSrc: string;
  presenceState: 'active' | 'fading' | 'idle';
  trustTier: 'admin' | 'verified' | 'artist' | 'user';
  metadata?: {
    avatarImage?: string;
    generatedAvatarSvg?: string;
    lastActivity?: number;
  };
}

export function useCurrentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/profile/me');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        
        const rawProfile = data.profile;
        const rawUser = data.user;
        
        if (!rawUser) throw new Error('No user data');

        const metadata = rawProfile?.socialLinks?.metadata || {};
        const lastActivity = rawProfile?.lastActivity || Date.now();
        const diff = (Date.now() - lastActivity) / 1000 / 60; // minutes

        const presenceState = diff < 2 ? 'active' : diff < 10 ? 'fading' : 'idle';
        const trustTier = rawProfile?.role || (rawProfile?.verified ? 'verified' : 'user');

        const normalizedProfile: Profile = {
          id: rawUser.uid,
          username: rawUser.username || 'user',
          artistName: rawProfile?.artistName || rawUser.username || 'Artist',
          role: trustTier,
          avatarSrc: resolveAvatar({
            avatarImage: metadata.avatarImage,
            generatedAvatarSvg: metadata.generatedAvatarSvg,
            username: rawUser.username || 'user'
          }),
          presenceState,
          trustTier,
          metadata
        };

        setProfile(normalizedProfile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return { profile, loading, error };
}
