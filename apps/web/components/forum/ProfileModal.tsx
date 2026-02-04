'use client';

import { useState } from 'react';
import { X, MapPin, Music, Calendar, ExternalLink, MessageSquare, UserPlus, CheckCircle2, ThumbsUp, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  profile: any;
}

export function ProfileModal({ isOpen, onClose, username, profile: userProfile }: ProfileModalProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [quickReply, setQuickReply] = useState('');

  if (!isOpen || !userProfile) return null;

  // Use the actual profile data passed in, or fallback to mock for stats if needed
  const displayName = userProfile.artistName || userProfile.displayName || username;
  const bio = userProfile.bio || '';
  const verified = userProfile.verified || userProfile.role === 'verified';
  const region = userProfile.region || '';
  const genre = userProfile.genre || '';
  const joinedAt = userProfile.createdAt ? new Date(userProfile.createdAt) : new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <h2 className="text-xl font-bold text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-5">
            <div className="col-span-2 p-6 bg-[#0a0a0a] border-r border-[#1a1a1a]">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <UserAvatar profile={userProfile} size="xl" />
                  {verified && (
                    <CheckCircle2 className="absolute -bottom-1 -right-1 w-7 h-7 text-green-500 bg-[#0a0a0a] rounded-full p-0.5" />
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                  {displayName}
                </h3>
                {verified && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/30 rounded font-medium mb-2">
                    VERIFIED ARTIST
                  </span>
                )}
                <p className="text-sm text-gray-400 mb-1">@{username}</p>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  {genre && (
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {genre}
                    </span>
                  )}
                  {region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {region}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-300 mb-6">
                  {bio}
                </p>

                <div className="flex items-center gap-1 text-xs text-gray-500 mb-6">
                  <Calendar className="w-3 h-3" />
                  Joined {joinedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  <Button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`
                      ${isFollowing
                        ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]'
                        : 'bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black'
                      }
                      font-semibold text-sm
                    `}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a] text-white font-semibold text-sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>

            <div className="col-span-3 p-6 bg-[#111111]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                Activity & Signal
              </h3>
              <div className="py-12 text-center opacity-50">
                <p className="text-sm text-zinc-500">Activity stream coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
