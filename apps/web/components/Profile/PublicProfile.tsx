
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Music,
  ExternalLink,
  Flag,
  UserPlus,
  MessageSquare,
  Loader2,
} from 'lucide-react';

interface PublicProfileProps {
  username: string;
  currentUserId?: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  verified: boolean;
  verificationStatus: string;
  role: string;
  profile: {
    displayName?: string;
    artistName?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    phone?: string;
    region?: string;
    genre?: string;
    socialProfileUrl?: string;
    showEmail: boolean;
    showPhone: boolean;
    publicReleases: boolean;
    allowContactRequests: boolean;
  };
  stats?: {
    followersCount?: number;
    gigsCount?: number;
    releasesCount?: number;
  };
}

export default function PublicProfile({ username, currentUserId }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUserId && profile?.id === currentUserId;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/profile/public/${username}`);
      
      if (!response.ok) {
        console.error('API Response not OK:', response.status);
        const text = await response.text();
        console.error('API Response body:', text);
        if (response.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
        return;
      }

      const data = await response.json();
      setProfile(data.user);
      setIsFollowing(data.isFollowing || false);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      alert('Please sign in to follow artists');
      return;
    }

    try {
      const response = await fetch(`/api/profile/public/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        if (profile?.stats) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followersCount: (profile.stats.followersCount || 0) + (isFollowing ? -1 : 1),
            },
          });
        }
      }
    } catch (error) {
      console.error('Follow action error:', error);
    }
  };

  const handleReport = () => {
    alert('Report functionality coming soon');
  };

  const handleContact = () => {
    alert('Contact request functionality coming soon');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF3C]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
          <Music className="w-8 h-8 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-white">{error || 'Profile not found'}</h1>
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Card */}
      <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 flex-shrink-0">
            <AvatarImage 
              src={profile.profile.avatar} 
              alt={profile.profile.displayName || profile.username} 
            />
            <AvatarFallback className="bg-[#9B5CFF] text-white text-2xl">
              {(profile.profile.artistName || profile.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-3xl font-bold text-white truncate">
                    {profile.profile.displayName || profile.profile.artistName || profile.username}
                  </h1>
                  {profile.verified && (
                    <Badge className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 flex-shrink-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                {profile.profile.artistName && profile.profile.artistName !== profile.profile.displayName && (
                  <p className="text-lg text-[#D7FF3C] mb-1">{profile.profile.artistName}</p>
                )}
                <p className="text-gray-400">@{profile.username}</p>
              </div>

              {!isOwnProfile && currentUserId && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    onClick={handleFollow}
                    className={
                      isFollowing
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90'
                    }
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  {profile.profile.allowContactRequests && (
                    <Button
                      onClick={handleContact}
                      variant="outline"
                      className="border-[#1a1a1a] hover:bg-[#1a1a1a]"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  )}
                  <Button
                    onClick={handleReport}
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {isOwnProfile && (
                <Button
                  onClick={() => window.location.href = '/settings'}
                  className="bg-gray-800 hover:bg-gray-700 flex-shrink-0"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-4">
              {profile.profile.region && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#D7FF3C]" />
                  <span>{profile.profile.region}</span>
                </div>
              )}
              {profile.profile.genre && (
                <div className="flex items-center gap-1">
                  <Music className="h-4 w-4 text-[#9B5CFF]" />
                  <span>{profile.profile.genre}</span>
                </div>
              )}
              {profile.profile.showEmail && profile.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-[#D7FF3C]" />
                  <a href={`mailto:${profile.email}`} className="hover:text-[#D7FF3C]">
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.profile.showPhone && profile.profile.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-[#D7FF3C]" />
                  <a href={`tel:${profile.profile.phone}`} className="hover:text-[#D7FF3C]">
                    {profile.profile.phone}
                  </a>
                </div>
              )}
            </div>

            {profile.profile.bio && (
              <p className="text-gray-300 whitespace-pre-wrap mb-4">{profile.profile.bio}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Card */}
      {profile.stats && (
        <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-[#D7FF3C]">
                {profile.stats.followersCount || 0}
              </p>
              <p className="text-sm text-gray-400">Followers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#9B5CFF]">
                {profile.stats.gigsCount || 0}
              </p>
              <p className="text-sm text-gray-400">Gigs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#FF6B9D]">
                {profile.stats.releasesCount || 0}
              </p>
              <p className="text-sm text-gray-400">Releases</p>
            </div>
          </div>
        </Card>
      )}

      {/* Social Links */}
      {profile.profile.socialProfileUrl && (
        <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Links</h2>
          <a
            href={profile.profile.socialProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#9B5CFF] hover:text-[#9B5CFF]/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {profile.profile.socialProfileUrl}
          </a>
        </Card>
      )}

      {/* Releases */}
      {profile.profile.publicReleases && (
        <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-[#D7FF3C]" />
            Recent Releases
          </h2>
          <p className="text-gray-400 text-center py-8">No releases yet</p>
        </Card>
      )}
    </div>
  );
}
