'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, MapPin, Music, Flag, UserPlus, ExternalLink } from 'lucide-react';

interface PublicProfileProps {
  user: {
    id: string;
    username: string;
    verified: boolean;
  };
  profile: {
    displayName?: string | null;
    artistName?: string | null;
    bio?: string | null;
    avatar?: string | null;
    region?: string | null;
    genre?: string | null;
    socialLinks?: Record<string, string> | null;
    showEmail?: boolean;
    showPhone?: boolean;
    publicReleases?: boolean;
  };
  stats?: {
    followersCount?: number;
    gigsCount?: number;
  };
  isOwnProfile?: boolean;
  currentUserId?: string | null;
}

export function PublicProfile({ user, profile, stats, isOwnProfile, currentUserId }: PublicProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleFollow = async () => {
    // TODO: Implement follow functionality
    setIsFollowing(!isFollowing);
  };

  const socialPlatforms = [
    { key: 'soundcloud', label: 'SoundCloud', color: 'orange' },
    { key: 'instagram', label: 'Instagram', color: 'pink' },
    { key: 'spotify', label: 'Spotify', color: 'green' },
    { key: 'bandcamp', label: 'Bandcamp', color: 'blue' },
    { key: 'mixcloud', label: 'Mixcloud', color: 'teal' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <Card className="bg-black border-lime-400/20 p-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.displayName || user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Music className="w-16 h-16 text-gray-600" />
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">
                {profile.displayName || profile.artistName || user.username}
              </h1>
              {user.verified && (
                <span title="Verified Artist">
                  <CheckCircle2 className="w-7 h-7 text-lime-400" />
                </span>
              )}
            </div>
            
            <p className="text-gray-400 mb-4">@{user.username}</p>

            <div className="flex flex-wrap gap-4 mb-4">
              {profile.region && (
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.region}</span>
                </div>
              )}
              {profile.genre && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Music className="w-4 h-4" />
                  <span>{profile.genre}</span>
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="text-gray-300 mb-6">{profile.bio}</p>
            )}

            {/* Stats */}
            {stats && (
              <div className="flex gap-6 mb-6">
                {stats.followersCount !== undefined && (
                  <div>
                    <span className="text-2xl font-bold text-white">{stats.followersCount}</span>
                    <span className="text-gray-400 ml-2">Followers</span>
                  </div>
                )}
                {stats.gigsCount !== undefined && (
                  <div>
                    <span className="text-2xl font-bold text-white">{stats.gigsCount}</span>
                    <span className="text-gray-400 ml-2">Gigs</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!isOwnProfile && currentUserId && (
                <>
                  <Button
                    onClick={handleFollow}
                    className={`${
                      isFollowing
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-lime-400 text-black hover:bg-lime-500'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReportDialog(true)}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                </>
              )}
              {isOwnProfile && (
                <Button
                  onClick={() => (window.location.href = '/dashboard/settings')}
                  className="bg-gray-800 hover:bg-gray-700"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Social Links */}
      {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
        <Card className="bg-black border-lime-400/20 p-6 mt-6">
          <h2 className="text-xl font-bold text-lime-400 mb-4">Social Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(profile.socialLinks).map(([key, url]) => {
              if (!url) return null;
              const platform = socialPlatforms.find((p) =>
                url.toLowerCase().includes(p.key)
              );
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-lime-400" />
                  <span className="text-white flex-1 truncate">
                    {platform?.label || 'Link'}
                  </span>
                </a>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Releases (if public) */}
      {profile.publicReleases && (
        <Card className="bg-black border-lime-400/20 p-6 mt-6">
          <h2 className="text-xl font-bold text-lime-400 mb-4">Recent Releases</h2>
          <p className="text-gray-400">No releases yet.</p>
        </Card>
      )}
    </div>
  );
}
