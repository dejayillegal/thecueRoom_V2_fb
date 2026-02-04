import { useState, useEffect } from 'react';
import { resolveAvatar } from '../avatar/avatarResolver';

export interface Profile {
  username: string;
  artistName: string;
  role: 'admin' | 'verified' | 'artist' | 'user';
  avatar: string;
  presenceState: 'active' | 'fading' | 'idle';
  trustTier: 'admin' | 'verified' | 'artist' | 'user';
  socialLinks?: any;
  profile?: any;
  user?: any;
}

export function useCurrentProfile() {
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/me');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      
      const rawProfile = data.profile || {};
      const rawUser = data.user;
      
      if (!rawUser) throw new Error('No user data');

      if (typeof rawProfile.socialLinks === 'string') {
        try {
          rawProfile.socialLinks = JSON.parse(rawProfile.socialLinks);
        } catch (e) {
          rawProfile.socialLinks = { metadata: {} };
        }
      }

      const lastActivity = rawProfile?.lastActivity || Date.now();
      const diff = (Date.now() - lastActivity) / 1000 / 60; // minutes

      const presenceState = diff < 2 ? 'active' : diff < 10 ? 'fading' : 'idle';
      const role = rawUser.role || (rawProfile?.verified ? 'verified' : 'user');

      setProfileData({
        user: rawUser,
        profile: rawProfile,
        username: rawUser.username || 'user',
        artistName: rawProfile?.artistName || rawUser.username || 'Artist',
        role: role as any,
        trustTier: role as any,
        presenceState,
        avatar: resolveAvatar(rawProfile),
        socialLinks: rawProfile?.socialLinks
      });
    } catch (err) {
      console.error('useCurrentProfile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const handleUpdate = () => fetchProfile();
    window.addEventListener("profile-updated", handleUpdate);
    return () => window.removeEventListener("profile-updated", handleUpdate);
  }, []);

  return { ...profileData, loading, refresh: fetchProfile };
}
