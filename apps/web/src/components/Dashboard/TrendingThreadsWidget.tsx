"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, ExternalLink, Share2 } from "lucide-react";
import { SkeletonList } from "@/components/ui/SkeletonCard";

interface TrendingThread {
  id: string;
  title: string;
  replies: number;
  likes: number;
  category?: string;
  author: string;
  createdAt: string;
}

interface TrendingThreadsWidgetProps {
  limit?: number;
  className?: string;
}

export function TrendingThreadsWidget({ limit = 5, className = "" }: TrendingThreadsWidgetProps) {
  const [threads, setThreads] = useState<TrendingThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/overview`);
        const data = await response.json();
        
        if (data.trendingThreads) {
          setThreads(data.trendingThreads.slice(0, limit));
        }
      } catch (err) {
        console.error("Failed to fetch threads:", err);
        setError("Failed to load trending threads");
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, [limit]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
        <h2 className="text-white text-xl font-semibold mb-4">Trending Threads</h2>
        <SkeletonList count={limit} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
        <h2 className="text-white text-xl font-semibold mb-4">Trending Threads</h2>
        <p className="text-red-500 text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-semibold">Trending Threads</h2>
        <Link href="/forum">
          <Button variant="ghost" size="sm" className="text-[#D7FF3C] hover:text-[#c8f02f] hover:bg-[#1a1a1a]">
            View All
          </Button>
        </Link>
      </div>

      {threads.length === 0 ? (
        <p className="text-gray-400 text-sm">No trending threads found</p>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="bg-[#0a0a0a] rounded-lg p-4 hover:bg-[#151515] transition-colors border border-[#1a1a1a]"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <Link href={`/forum/thread/${thread.id}`} className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm line-clamp-2 hover:text-[#D7FF3C] transition-colors">
                    {thread.title}
                  </h3>
                </Link>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{thread.replies}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{thread.likes}</span>
                  </div>
                  {thread.category && (
                    <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                      {thread.category}
                    </Badge>
                  )}
                  <span className="text-gray-500">•</span>
                  <span>{formatTimeAgo(thread.createdAt)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/forum/thread/${thread.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                      aria-label="Open thread"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
