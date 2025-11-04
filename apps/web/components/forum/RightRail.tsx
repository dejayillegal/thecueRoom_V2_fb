'use client';

import { Calendar, Eye, MessageSquare, ThumbsUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ThreadMeta {
  category: string;
  createdAt: Date;
  replyCount: number;
  viewCount: number;
  likesCount: number;
  participants: Array<{
    username: string;
    displayName: string;
    avatar?: string;
  }>;
}

interface RightRailProps {
  thread: ThreadMeta;
  similarThreads?: Array<{
    id: string;
    title: string;
    replyCount: number;
    viewCount: number;
  }>;
}

interface TrendingThread {
  id: string;
  title: string;
  replyCount: number;
  viewCount: number;
  likesCount: number;
}

export function RightRail({ thread, similarThreads = [] }: RightRailProps) {
  const [trendingThreads, setTrendingThreads] = useState<TrendingThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/forum/thread?sort=trending&limit=5');
        if (!response.ok) throw new Error('Failed to fetch trending threads');
        const data = await response.json();
        setTrendingThreads(data.threads || []);
      } catch (error) {
        console.error('Error fetching trending threads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="space-y-4">
      {/* Thread Info */}
      <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
          Thread Info
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Category</span>
            <span className="text-[#9B5CFF] font-medium">{thread.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Created</span>
            <span className="text-white">{formatDate(thread.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Replies</span>
            <span className="text-white flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {thread.replyCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Views</span>
            <span className="text-white flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {thread.viewCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Likes</span>
            <span className="text-white flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {thread.likesCount}
            </span>
          </div>
        </div>

        {thread.participants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Participants ({thread.participants.length})
            </h4>
            <div className="flex -space-x-2">
              {thread.participants.slice(0, 5).map((participant, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-xs font-bold border-2 border-[#0a0a0a]"
                  title={participant.displayName}
                >
                  {participant.displayName[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Similar Threads */}
      {similarThreads.length > 0 && (
        <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
            Similar Threads
          </h3>
          <div className="space-y-3">
            {similarThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/community/thread/${thread.id}`}
                className="block hover:bg-[#111111] rounded p-2 -mx-2 transition-colors"
              >
                <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">
                  {thread.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{thread.replyCount} replies</span>
                  <span>•</span>
                  <span>{thread.viewCount} views</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Trending Threads */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-[#D7FF3C]" />
          Trending
        </h3>
        {loading ? (
          <div className="text-xs text-gray-500">Loading...</div>
        ) : trendingThreads.length === 0 ? (
          <div className="text-xs text-gray-500">No trending threads yet</div>
        ) : (
          <div className="space-y-3">
            {trendingThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/community/thread/${thread.id}`}
                className="block hover:bg-[#111111] rounded p-2 -mx-2 transition-colors group cursor-pointer"
              >
                <h4 className="text-sm font-medium text-white group-hover:text-[#D7FF3C] mb-2 line-clamp-2 transition-colors">
                  {thread.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {thread.replyCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {thread.viewCount}
                  </span>
                  <span className="text-white flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {thread.likesCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}