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
        const response = await fetch(`/api/dashboard/overview`, { cache: "no-store" });
        const data = await response.json();

        if (data.trendingThreads) {
          setThreads(data.trendingThreads.slice(0, limit));
        }
      } catch (err) {
        console.error("Failed to fetch threads:", err);
        setError("Failed to load threads");
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();

    // Refresh threads every 2 minutes
    const interval = setInterval(fetchThreads, 2 * 60 * 1000);

    return () => clearInterval(interval);
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
    <Card className={`bg-[#111111] border-[#1a1a1a] p-6 relative overflow-hidden flex flex-col h-[400px] ${className}`}>
      <div className="flex items-center justify-between mb-6 relative z-10 bg-[#111111]">
        <h2 className="text-white text-xl font-semibold flex items-center gap-2">
          <span className="w-1 h-5 bg-[#D7FF3C] rounded-full" />
          Trending Threads
        </h2>
        <Link href="/forum">
          <Button variant="ghost" size="sm" className="text-[#D7FF3C] hover:text-[#c8f02f] hover:bg-white/5 transition-all">
            View All
          </Button>
        </Link>
      </div>

      {threads.length === 0 ? (
        <p className="text-gray-400 text-sm">No trending threads found</p>
      ) : (
        <div className="flex-1 relative overflow-hidden group">
          {/* Top/Bottom Fades */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#111111] to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#111111] to-transparent z-10 pointer-events-none" />
          
          <div className="h-full overflow-hidden">
            <div 
              className="flex flex-col gap-3 animate-vertical-scroll hover:[animation-play-state:paused] transition-all duration-500"
              style={{
                animationDuration: `${threads.length * 4}s`,
              }}
            >
              {[...threads, ...threads].map((thread, idx) => (
                <div
                  key={`${thread.id}-${idx}`}
                  className="bg-[#0a0a0a]/50 backdrop-blur-sm rounded-xl p-4 hover:bg-[#151515] transition-all border border-white/5 hover:border-[#D7FF3C]/30 group/item"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link href={`/forum/thread/${thread.id}`} className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm line-clamp-2 group-hover/item:text-[#D7FF3C] transition-colors leading-tight">
                        {thread.title}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" />
                        <span>{thread.replies}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3 w-3 text-red-500/50" />
                        <span>{thread.likes}</span>
                      </div>
                      {thread.category && (
                        <span className="bg-[#D7FF3C]/10 text-[#D7FF3C] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {thread.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 font-medium">{formatTimeAgo(thread.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes vertical-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-vertical-scroll {
          animation: vertical-scroll linear infinite;
        }
      `}</style>
    </Card>
  );
}