import { useState, useEffect } from 'react';
import { resolveAvatar } from './avatarResolver';

export interface Profile {
  username: string;
  artistName: string;
  role: 'admin' | 'verified' | 'artist' | 'user';
  avatarSrc: string;
  presenceState: 'active' | 'fading' | 'idle';
  trustTier: 'admin' | 'verified' | 'artist' | 'user';
}

export function useCurrentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
        const role = rawProfile?.role || (rawProfile?.verified ? 'verified' : 'user');

        setProfile({
          username: rawUser.username || 'user',
          artistName: rawProfile?.artistName || rawUser.username || 'Artist',
          role: role,
          trustTier: role,
          presenceState,
          avatarSrc: resolveAvatar({
            avatarImage: metadata.avatarImage,
            generatedAvatarSvg: metadata.generatedAvatarSvg,
            username: rawUser.username || 'user'
          })
        });
      } catch (err) {
        console.error('useCurrentProfile error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return { profile, loading };
}
