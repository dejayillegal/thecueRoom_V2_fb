'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, Eye, Pin, Lock, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { UserProfileCard } from './UserProfileCard';

interface Thread {
  id: string;
  title: string;
  excerpt: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
    genre?: string;
  };
  category: string;
  tags: string[];
  replies: number;
  views: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  lastActivity: Date;
  hasNewReplies?: boolean;
}

const mockThreads: Thread[] = [
  {
    id: '1',
    title: 'What\'s the best synth for a beginner under $500?',
    excerpt: 'Looking to get into synthesis and need recommendations for a hardware synth. Interested in FM and subtractive...',
    author: {
      username: 'synthwave_kid',
      displayName: 'Alex Chen',
      verified: false,
      genre: 'Electronic',
    },
    category: 'Gear Talk',
    tags: ['synthesizers', 'beginner', 'hardware'],
    replies: 24,
    views: 342,
    likes: 18,
    isPinned: false,
    isLocked: false,
    createdAt: new Date('2024-11-02T10:30:00'),
    lastActivity: new Date('2024-11-03T15:22:00'),
    hasNewReplies: true,
  },
  {
    id: '2',
    title: 'Gibson Les Paul vs PRS Custom 24 - Which one for jazz/fusion?',
    excerpt: 'Been playing a Strat for years but looking to expand. Need something with warmer tones for jazz but versatile enough...',
    author: {
      username: 'jazzfusion_pro',
      displayName: 'Marcus J.',
      verified: true,
      genre: 'Jazz',
    },
    category: 'Gear Talk',
    tags: ['guitars', 'gibson', 'prs', 'jazz'],
    replies: 47,
    views: 891,
    likes: 52,
    isPinned: true,
    isLocked: false,
    createdAt: new Date('2024-11-01T08:15:00'),
    lastActivity: new Date('2024-11-03T14:10:00'),
  },
  {
    id: '3',
    title: 'Best DAW for Mac in 2024? Logic vs Ableton vs FL Studio',
    excerpt: 'Making the switch from PC to Mac M3 and need to choose a new DAW. Mainly producing hip-hop and trap...',
    author: {
      username: 'beatmaker_x',
      displayName: 'DJ Trix',
      verified: false,
      genre: 'Hip-Hop',
    },
    category: 'Production',
    tags: ['daw', 'logic', 'ableton', 'mac'],
    replies: 63,
    views: 1247,
    likes: 31,
    isPinned: false,
    isLocked: false,
    createdAt: new Date('2024-10-31T20:45:00'),
    lastActivity: new Date('2024-11-03T12:30:00'),
    hasNewReplies: true,
  },
];

export function ThreadsList() {
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'unanswered'>('newest');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('newest')}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${sortBy === 'newest' 
                ? 'bg-[#1a1a1a] text-[#D7FF3C] border border-[#2a2a2a]' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]'
              }
            `}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            Newest
          </button>
          <button
            onClick={() => setSortBy('trending')}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${sortBy === 'trending' 
                ? 'bg-[#1a1a1a] text-[#D7FF3C] border border-[#2a2a2a]' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]'
              }
            `}
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Trending
          </button>
          <button
            onClick={() => setSortBy('unanswered')}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${sortBy === 'unanswered' 
                ? 'bg-[#1a1a1a] text-[#D7FF3C] border border-[#2a2a2a]' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]'
              }
            `}
          >
            Unanswered
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {mockThreads.length} threads
        </span>
      </div>

      <div className="space-y-3">
        {mockThreads.map((thread) => (
          <Link 
            key={thread.id} 
            href={`/forum/thread/${thread.id}`}
            className="block"
          >
            <div className={`
              bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4
              hover:border-[#2a2a2a] hover:bg-[#111111] transition-all duration-150
              ${thread.hasNewReplies ? 'border-l-2 border-l-[#D7FF3C]' : ''}
            `}>
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    {thread.isPinned && (
                      <Pin className="w-4 h-4 text-[#D7FF3C] flex-shrink-0 mt-0.5" />
                    )}
                    <h3 className="text-base font-semibold text-white group-hover:text-[#D7FF3C] transition-colors line-clamp-2">
                      {thread.title}
                    </h3>
                    {thread.isLocked && (
                      <Lock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {thread.excerpt}
                  </p>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-[10px] font-bold">
                        {thread.author.displayName[0]}
                      </div>
                      <span className="text-xs text-gray-300 flex items-center gap-1">
                        {thread.author.displayName}
                        {thread.author.verified && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-[#9B5CFF] rounded">
                      {thread.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(thread.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {thread.tags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag} 
                        className="text-xs px-2 py-1 bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between min-w-[120px]">
                  <div className="flex flex-col gap-2 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-gray-400">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm font-medium">{thread.replies}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">{formatNumber(thread.views)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-gray-400">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs">{thread.likes}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(thread.lastActivity)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <button className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 text-sm font-medium rounded-lg transition-colors">
          Load More Threads
        </button>
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

function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}
