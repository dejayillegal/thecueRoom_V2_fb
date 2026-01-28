'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, Eye, Pin, Lock, CheckCircle2, Clock, TrendingUp, Sparkles, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchThreads = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch(`/api/forum/thread?sort=${sortBy}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch threads');
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchThreads(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-[24px] animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          {['newest', 'trending', 'unanswered'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSortBy(tab as any)}
              className={`
                px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all border
                ${sortBy === tab 
                  ? 'bg-[#D1FF3D] text-black border-[#D1FF3D] shadow-[0_0_15px_rgba(209,255,61,0.2)]' 
                  : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/10 hover:text-white'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className={`p-2 rounded-full border border-white/5 hover:border-[#D1FF3D]/30 transition-all group ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="w-3 h-3 text-zinc-500 group-hover:text-[#D1FF3D]" />
          </button>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            {threads.length} ACTIVE SIGNALS
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {threads.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/[0.02] rounded-[32px] border border-dashed border-white/10"
            >
              <div className="mb-4 inline-flex p-4 rounded-full bg-white/5">
                <Sparkles className="w-6 h-6 text-[#D1FF3D]/40" />
              </div>
              <h3 className="text-white font-bold tracking-tight">Transmission Silence</h3>
              <p className="text-zinc-600 text-xs font-light mt-2">The frequency is clear. Start a new signal to begin discussion.</p>
            </motion.div>
          ) : (
            threads.map((thread, idx) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <ThreadCard thread={thread} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ThreadCard({ thread }: { thread: Thread }) {
  const displayName = thread.user?.profile?.displayName || thread.user?.username || 'Anonymous';
  const excerpt = thread.body?.substring(0, 140) + (thread.body?.length > 140 ? '...' : '');

  return (
    <Link href={`/community/thread/${thread.id}`} className="block group">
      <div className={`
        bg-[#111111]/40 border border-white/5 rounded-[32px] p-8
        hover:bg-[#151515] hover:border-[#D1FF3D]/20 transition-all duration-500 backdrop-blur-md relative overflow-hidden
        ${thread.isPinned ? 'ring-1 ring-[#D1FF3D]/20' : ''}
      `}>
        {/* Subtle Waveform Separator */}
        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
           <TrendingUp className="w-4 h-4 text-[#D1FF3D]/20" />
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D1FF3D] to-[#9B5CFF] p-[1px]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black text-white">
                    {displayName[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white flex items-center gap-1 group-hover:text-[#D1FF3D] transition-colors">
                    {displayName}
                    {thread.user?.verified && <CheckCircle2 className="w-3 h-3 text-[#D1FF3D]" />}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                    {formatTimeAgo(new Date(thread.createdAt))}
                  </span>
                </div>
              </div>
              {thread.category && (
                <span className="text-[9px] px-2.5 py-1 bg-[#9B5CFF]/10 text-[#9B5CFF] rounded-full font-black uppercase tracking-widest border border-[#9B5CFF]/20">
                  {thread.category.name}
                </span>
              )}
            </div>

            <div className="flex items-start gap-3 mb-3">
              {thread.isPinned && <Pin className="w-4 h-4 text-[#D1FF3D] flex-shrink-0 mt-1" />}
              <h3 className="text-xl font-bold text-white leading-tight tracking-tight group-hover:italic transition-all">
                {thread.title}
              </h3>
            </div>

            <p className="text-sm text-zinc-500 font-light leading-relaxed mb-6 line-clamp-2 italic border-l border-white/5 pl-6 group-hover:border-[#D1FF3D]/20 transition-colors">
              {excerpt}
            </p>

            <div className="flex items-center gap-4">
              {thread.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-mono text-zinc-600 border border-white/5 px-2.5 py-0.5 rounded-full hover:border-[#D1FF3D]/30 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end justify-between min-w-[100px] border-l border-white/5 pl-8">
            <div className="flex flex-col gap-4 text-right">
              <div className="group/stat">
                <MessageSquare className="w-4 h-4 text-zinc-700 ml-auto mb-1 group-hover/stat:text-[#D1FF3D] transition-colors" />
                <span className="text-lg font-black text-white">{thread.replyCount}</span>
              </div>
              <div className="flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-end gap-1.5 text-zinc-500">
                  <Eye className="w-3 h-3" />
                  <span className="text-[10px] font-mono">{formatNumber(thread.viewCount)}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-zinc-500">
                  <ThumbsUp className="w-3 h-3" />
                  <span className="text-[10px] font-mono">{thread.likesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
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
