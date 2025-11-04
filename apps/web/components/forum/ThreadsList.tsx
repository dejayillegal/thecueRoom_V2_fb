'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, Eye, Pin, Lock, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  body: string;
  userId: string;
  categoryId: string | null;
  slug: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
    verified: boolean;
  };
  category?: {
    name: string;
  };
}

export function ThreadsList() {
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'unanswered'>('newest');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/forum/thread?sort=${sortBy}&limit=20`);
        if (!response.ok) throw new Error('Failed to fetch threads');
        const data = await response.json();
        setThreads(data.threads || []);
      } catch (error) {
        console.error('Error fetching threads:', error);
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading threads...</div>
        </div>
      </div>
    );
  }

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
          {threads.length} threads
        </span>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No threads found. Be the first to start a discussion!
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const displayName = thread.user?.profile?.displayName || thread.user?.username || 'Anonymous';
            const excerpt = thread.body?.substring(0, 150) + (thread.body?.length > 150 ? '...' : '');
            
            return (
              <Link 
                key={thread.id} 
                href={`/community/thread/${thread.id}`}
                className="block group"
              >
                <div className={`
                  bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4
                  hover:border-[#2a2a2a] hover:bg-[#111111] transition-all duration-150 cursor-pointer
                  ${thread.isPinned ? 'border-l-2 border-l-[#D7FF3C]' : ''}
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
                        {excerpt}
                      </p>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-[10px] font-bold">
                            {displayName[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-300 flex items-center gap-1">
                            {displayName}
                            {thread.user?.verified && (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            )}
                          </span>
                        </div>
                        {thread.category && (
                          <span className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-[#9B5CFF] rounded">
                            {thread.category.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(new Date(thread.createdAt))}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        {thread.tags?.slice(0, 3).map((tag) => (
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
                        <button 
                          className="flex items-center justify-end gap-1.5 text-gray-400 hover:text-[#D7FF3C] transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/community/thread/${thread.id}`;
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">{thread.replyCount}</span>
                        </button>
                        <div className="flex items-center justify-end gap-1.5 text-gray-400">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">{formatNumber(thread.viewCount)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 text-gray-400">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-xs">{thread.likesCount}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(new Date(thread.updatedAt))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {threads.length >= 20 && (
        <div className="flex justify-center pt-4">
          <button className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 text-sm font-medium rounded-lg transition-colors">
            Load More Threads
          </button>
        </div>
      )}
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
