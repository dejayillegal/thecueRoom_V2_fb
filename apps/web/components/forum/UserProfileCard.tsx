'use client';

import { CheckCircle2, ExternalLink, Music, MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface UserProfileCardProps {
  user: {
    username: string;
    displayName?: string;
    artistName?: string;
    avatarImage?: string;
    generatedAvatarSvg?: string;
    bio?: string;
    region?: string;
    genre?: string;
    verified?: boolean;
    socialProfileUrl?: string;
    aiCredits?: number;
    lastActivity?: number;
    role?: 'admin' | 'verified' | 'artist' | 'user';
  };
  variant?: 'full' | 'compact' | 'inline';
}

export function UserProfileCard({ user, variant = 'full' }: UserProfileCardProps) {
  const avatarProps = {
    username: user.username,
    avatarImage: user.avatarImage,
    generatedAvatarSvg: user.generatedAvatarSvg,
    lastActivity: user.lastActivity,
    role: user.role || (user.verified ? 'verified' : 'user')
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <Avatar {...avatarProps} className="w-8 h-8" />
        <div className="flex flex-col">
          <span className="text-sm text-white font-medium flex items-center gap-1">
            {user.artistName || user.displayName || user.username}
          </span>
          <span className="text-xs text-gray-500">@{user.username}</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
        <Avatar {...avatarProps} className="w-12 h-12" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {user.artistName || user.displayName || user.username}
            </h4>
            {user.verified && (
              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded">
                VERIFIED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-1">@{user.username}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {user.genre && (
              <span className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                {user.genre}
              </span>
            )}
            {user.region && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.region}
              </span>
            )}
          </div>
          {user.socialProfileUrl && (
            <a
              href={user.socialProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#D7FF3C] hover:underline"
            >
              View Profile
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Full variant - detailed profile card
  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-start gap-4 mb-4">
        <Avatar {...avatarProps} className="w-16 h-16" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">
              {user.artistName || user.displayName || user.username}
            </h3>
            {user.verified && (
              <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded font-medium">
                VERIFIED
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-2">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{user.bio}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {user.genre && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-[#1a1a1a] text-gray-300 rounded">
            <Music className="w-3 h-3" />
            {user.genre}
          </span>
        )}
        {user.region && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-[#1a1a1a] text-gray-300 rounded">
            <MapPin className="w-3 h-3" />
            {user.region}
          </span>
        )}
      </div>

      {user.socialProfileUrl && (
        <a
          href={user.socialProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[#D7FF3C] hover:text-[#e7ff6f] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Social Profile
        </a>
      )}
    </div>
  );
}
