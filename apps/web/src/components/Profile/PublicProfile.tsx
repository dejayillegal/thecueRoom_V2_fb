
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Mail, Phone, MapPin, Music, ExternalLink, Flag, MessageSquare } from 'lucide-react';

interface PublicProfileProps {
  username: string;
  currentUserId?: string;
}

interface UserProfile {
  id: string;
  username: string;
  artistName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  region: string;
  genre: string;
  bio?: string;
  avatar?: string;
  socialLinks: string[];
  isVerified: boolean;
  showEmail: boolean;
  showPhone: boolean;
  publicReleases: boolean;
  allowContactRequests: boolean;
  stats: {
    followers: number;
    gigs: number;
    releases: number;
  };
  releases?: Array<{
    id: string;
    title: string;
    coverUrl: string;
    releaseDate: string;
  }>;
}

export default function PublicProfile({ username, currentUserId }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${username}`);
      const data = await response.json();
      
      if (data.ok) {
        setProfile(data.profile);
        setIsFollowing(data.isFollowing || false);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`/api/profile/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST'
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        setProfile(prev => prev ? {
          ...prev,
          stats: { ...prev.stats, followers: prev.stats.followers + (isFollowing ? -1 : 1) }
        } : null);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleReport = async () => {
    // Implementation for reporting
    alert('Report functionality coming soon');
  };

  const handleContact = async () => {
    // Implementation for contact requests
    alert('Contact request functionality coming soon');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D7FF3C] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400">The user @{username} does not exist.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Card */}
      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar} alt={profile.artistName} />
            <AvatarFallback className="bg-[#9B5CFF] text-white text-2xl">
              {profile.artistName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-white">{profile.artistName}</h1>
              {profile.isVerified && (
                <Badge className="bg-[#D7FF3C] text-black">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-gray-400 mb-3">@{profile.username}</p>

            <div className="flex flex-wrap gap-3 text-sm text-gray-300 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {profile.region}
              </div>
              <div className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                {profile.genre}
              </div>
              {profile.showEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </div>
              )}
              {profile.showPhone && profile.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </div>
              )}
            </div>

            {currentUserId && currentUserId !== profile.id && (
              <div className="flex gap-2">
                <Button
                  onClick={handleFollow}
                  className={isFollowing ? 'bg-gray-700 hover:bg-gray-600' : 'bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90'}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                {profile.allowContactRequests && (
                  <Button onClick={handleContact} variant="outline" className="border-[#1a1a1a]">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                )}
                <Button onClick={handleReport} variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Card */}
      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-[#D7FF3C]">{profile.stats.followers}</p>
            <p className="text-sm text-gray-400">Followers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#9B5CFF]">{profile.stats.gigs}</p>
            <p className="text-sm text-gray-400">Gigs</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#FF6B9D]">{profile.stats.releases}</p>
            <p className="text-sm text-gray-400">Releases</p>
          </div>
        </div>
      </Card>

      {/* Bio Card */}
      {profile.bio && (
        <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Bio</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
        </Card>
      )}

      {/* Social Links Card */}
      {profile.socialLinks.length > 0 && (
        <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Links</h2>
          <div className="space-y-2">
            {profile.socialLinks.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#9B5CFF] hover:text-[#9B5CFF]/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {link}
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Releases Card */}
      {profile.publicReleases && profile.releases && profile.releases.length > 0 && (
        <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Releases</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {profile.releases.map((release) => (
              <div key={release.id} className="group cursor-pointer">
                <div className="aspect-square bg-[#1a1a1a] rounded-lg mb-2 overflow-hidden">
                  <img
                    src={release.coverUrl}
                    alt={release.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-sm font-medium text-white truncate">{release.title}</p>
                <p className="text-xs text-gray-400">{release.releaseDate}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
