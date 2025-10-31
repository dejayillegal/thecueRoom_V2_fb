'use client';

import { CheckCircle2, ExternalLink, Music, MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface UserProfileCardProps {
  user: {
    username: string;
    displayName?: string;
    artistName?: string;
    avatar?: string;
    bio?: string;
    region?: string;
    genre?: string;
    verified?: boolean;
    socialProfileUrl?: string;
    aiCredits?: number;
  };
  variant?: 'full' | 'compact' | 'inline';
}

export function UserProfileCard({ user, variant = 'full' }: UserProfileCardProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-xs font-bold">
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName || user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          {user.verified && (
            <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 bg-[#0a0a0a] rounded-full" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-white font-medium flex items-center gap-1">
            {user.displayName || user.username}
          </span>
          {user.artistName && (
            <span className="text-xs text-gray-500">@{user.username}</span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-sm font-bold">
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName || user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          {user.verified && (
            <CheckCircle2 className="absolute -bottom-1 -right-1 w-4 h-4 text-green-500 bg-[#0a0a0a] rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {user.displayName || user.username}
            </h4>
            {user.verified && (
              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded">
                VERIFIED
              </span>
            )}
          </div>
          {user.artistName && (
            <p className="text-xs text-gray-400 mb-1">@{user.username}</p>
          )}
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
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-lg font-bold">
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName || user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          {user.verified && (
            <CheckCircle2 className="absolute -bottom-1 -right-1 w-5 h-5 text-green-500 bg-[#0a0a0a] rounded-full p-0.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">
              {user.displayName || user.username}
            </h3>
            {user.verified && (
              <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded font-medium">
                VERIFIED
              </span>
            )}
          </div>
          {user.artistName && (
            <p className="text-sm text-gray-400 mb-2">Artist: {user.artistName}</p>
          )}
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
