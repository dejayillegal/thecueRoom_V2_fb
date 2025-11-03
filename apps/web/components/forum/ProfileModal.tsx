'use client';

import { useState } from 'react';
import { X, MapPin, Music, Calendar, ExternalLink, MessageSquare, UserPlus, CheckCircle2, ThumbsUp, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

interface UserProfile {
  username: string;
  displayName: string;
  avatar?: string;
  bio: string;
  verified: boolean;
  region?: string;
  genre?: string;
  joinedAt: Date;
  stats: {
    threads: number;
    replies: number;
    likes: number;
    followers: number;
  };
  badges: string[];
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: 'thread' | 'reply';
  title: string;
  threadId: string;
  excerpt: string;
  createdAt: Date;
  likes: number;
  replies: number;
}

const mockProfile: UserProfile = {
  username: 'jazzfusion_pro',
  displayName: 'Marcus J.',
  bio: 'Professional jazz guitarist and gear enthusiast. 20+ years experience. Always happy to help fellow musicians!',
  verified: true,
  region: 'New York, NY',
  genre: 'Jazz / Fusion',
  joinedAt: new Date('2023-06-15'),
  stats: {
    threads: 247,
    replies: 1832,
    likes: 4521,
    followers: 892,
  },
  badges: ['Top Contributor', 'Verified Artist', 'Helpful'],
  recentActivity: [
    {
      id: '1',
      type: 'reply',
      title: 'Best synth for a beginner under $500?',
      threadId: '1',
      excerpt: 'I started with the Minilogue XD and it\'s absolutely fantastic for learning...',
      createdAt: new Date('2024-11-02T11:15:00'),
      likes: 12,
      replies: 3,
    },
    {
      id: '2',
      type: 'thread',
      title: 'PRS Custom 24 vs Gibson Les Paul for jazz',
      threadId: '2',
      excerpt: 'After years of playing both, here\'s my detailed comparison...',
      createdAt: new Date('2024-11-01T08:15:00'),
      likes: 52,
      replies: 47,
    },
  ],
};

export function ProfileModal({ isOpen, onClose, username }: ProfileModalProps) {
  const [profile] = useState<UserProfile>(mockProfile);
  const [isFollowing, setIsFollowing] = useState(false);
  const [quickReply, setQuickReply] = useState('');

  if (!isOpen) return null;

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
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-3xl font-bold">
                    {profile.displayName[0]}
                  </div>
                  {profile.verified && (
                    <CheckCircle2 className="absolute -bottom-1 -right-1 w-7 h-7 text-green-500 bg-[#0a0a0a] rounded-full p-0.5" />
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                  {profile.displayName}
                </h3>
                {profile.verified && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/30 rounded font-medium mb-2">
                    VERIFIED ARTIST
                  </span>
                )}
                <p className="text-sm text-gray-400 mb-1">@{profile.username}</p>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  {profile.genre && (
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {profile.genre}
                    </span>
                  )}
                  {profile.region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.region}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-300 mb-6">
                  {profile.bio}
                </p>

                <div className="flex items-center gap-1 text-xs text-gray-500 mb-6">
                  <Calendar className="w-3 h-3" />
                  Joined {profile.joinedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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

                <div className="w-full pt-6 border-t border-[#1a1a1a]">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#D7FF3C]">
                        {profile.stats.threads}
                      </div>
                      <div className="text-xs text-gray-500">Threads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#9B5CFF]">
                        {profile.stats.replies}
                      </div>
                      <div className="text-xs text-gray-500">Replies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {profile.stats.likes}
                      </div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {profile.stats.followers}
                      </div>
                      <div className="text-xs text-gray-500">Followers</div>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-4 border-t border-[#1a1a1a]">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Badges
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded text-xs"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-3 p-6 bg-[#111111]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                Recent Activity
              </h3>

              <div className="space-y-4 mb-6">
                {profile.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`
                        text-xs px-2 py-0.5 rounded font-medium
                        ${activity.type === 'thread'
                          ? 'bg-[#D7FF3C]/10 text-[#D7FF3C]'
                          : 'bg-[#9B5CFF]/10 text-[#9B5CFF]'
                        }
                      `}>
                        {activity.type === 'thread' ? 'Thread' : 'Reply'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white mb-2 line-clamp-1">
                      {activity.title}
                    </h4>

                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {activity.excerpt}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {activity.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {activity.replies}
                      </span>
                      <a
                        href={`/forum/thread/${activity.threadId}`}
                        className="flex items-center gap-1 text-[#D7FF3C] hover:underline ml-auto"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Quick Thread Mention
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickReply}
                    onChange={(e) => setQuickReply(e.target.value)}
                    placeholder={`@${profile.username} what do you think about...`}
                    className="flex-1 px-3 py-2 bg-[#111111] border border-[#1a1a1a] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#D7FF3C]"
                  />
                  <Button
                    className="bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black font-semibold"
                    disabled={!quickReply.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Start a thread mentioning this user
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
