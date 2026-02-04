import { useState, useEffect } from 'react';

export interface Profile {
  username: string;
  artistName: string;
  role: 'admin' | 'verified' | 'artist' | 'user';
  avatarSrc: string;
  presenceState: 'active' | 'fading' | 'idle';
  trustTier: 'admin' | 'verified' | 'artist' | 'user';
  socialLinks?: any;
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

        const lastActivity = rawProfile?.lastActivity || Date.now();
        const diff = (Date.now() - lastActivity) / 1000 / 60; // minutes

        const presenceState = diff < 2 ? 'active' : diff < 10 ? 'fading' : 'idle';
        const role = rawProfile?.role || (rawProfile?.verified ? 'verified' : 'user');

        // Note: UserAvatar component uses getAvatarSrc(profile)
        // We pass the raw profile object which contains socialLinks.metadata.avatarImage etc.
        setProfile({
          ...rawProfile,
          username: rawUser.username || 'user',
          artistName: rawProfile?.artistName || rawUser.username || 'Artist',
          role: role,
          trustTier: role,
          presenceState,
          socialLinks: rawProfile?.socialLinks // Ensure metadata is available for getAvatarSrc
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
