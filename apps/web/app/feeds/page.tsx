'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';
import { AuthButton } from '@/components/auth/AuthButton';

interface FeedItem {
  id: string;
  title: string;
  summary: string | null;
  link: string;
  image: string | null;
  tags: string[] | null;
  publishedAt: Date;
  createdAt: Date;
  source: {
    id: string;
    name: string;
    url: string;
    tags: string[] | null;
  } | null;
}

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadFeeds = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (cursor) params.append('cursor', cursor);

      const response = await fetch(`/api/feeds?${params}`);
      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        setFeeds(prev => [...prev, ...data.data]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore]);

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadFeeds();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadFeeds]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="grain-overlay" />

      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              thecueRoom
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/ai/cover-art" className="hover:text-primary transition-colors">
              AI Studio
            </Link>
            <Link href="/community" className="hover:text-primary transition-colors">
              Community
            </Link>
            <AuthButton />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Global Music Feeds
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Curated techno & house news from 60+ worldwide sources
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feeds.map((feed) => (
              <article 
                key={feed.id}
                className="bg-card overflow-hidden border border-border hover:border-primary/50 transition-all group"
              >
                <Link href={feed.link} target="_blank" rel="noopener noreferrer">
                  <div className="relative h-64 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                    <img
                      src={feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`}
                      alt={feed.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/80">
                          <span className="font-medium text-primary">
                            {feed.source?.name || 'Unknown Source'}
                          </span>
                          <span>{formatDate(feed.publishedAt)}</span>
                        </div>

                        <h3 className="text-lg font-semibold line-clamp-2 text-white group-hover:text-primary transition-colors">
                          {feed.title}
                        </h3>

                        {feed.summary && (
                          <p className="text-sm text-white/70 line-clamp-2">
                            {feed.summary}
                          </p>
                        )}

                        {feed.tags && feed.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {feed.tags.slice(0, 3).map((tag, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 text-xs bg-primary/20 text-primary border border-primary/30"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div ref={observerTarget} className="h-20 flex items-center justify-center">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading more feeds...</span>
              </div>
            )}
            {!hasMore && feeds.length > 0 && (
              <p className="text-muted-foreground">You've reached the end</p>
            )}
            {feeds.length === 0 && !isLoading && (
              <p className="text-muted-foreground">No feeds available yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}