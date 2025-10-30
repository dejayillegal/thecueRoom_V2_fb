'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';

interface FeedItem {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  image: string | null;
  tags: string[] | null;
  publishedAt: string | Date;
  source: string;
}

const FeedCard = memo(({ feed, formatDate }: { feed: FeedItem; formatDate: (date: Date) => string }) => {
  const [imgSrc, setImgSrc] = useState(feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <article className="bg-card overflow-hidden border border-border hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
      <Link href={feed.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative">
          <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
            )}
            <img
              src={imgSrc}
              alt={feed.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
                setIsLoading(false);
              }}
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span className="font-medium truncate max-w-[60%] drop-shadow-md">
                    {feed.source || 'Unknown Source'}
                  </span>
                  <span className="drop-shadow-md">{formatDate(feed.publishedAt)}</span>
                </div>

                <h3 className="text-[14px] sm:text-[15.5px] font-bold line-clamp-3 text-white leading-tight drop-shadow-lg">
                  {feed.title}
                </h3>

                {feed.summary && (
                  <p className="text-[13px] leading-relaxed text-white/80 line-clamp-2 drop-shadow-md">
                    {feed.summary}
                  </p>
                )}

                {feed.tags && feed.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {feed.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-[11px] font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-full hover:bg-white/30 transition-colors drop-shadow-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
});

FeedCard.displayName = 'FeedCard';

export default function NewsSection() {
  const [newsFeeds, setNewsFeeds] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatDate = useCallback((date: Date) => {
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
  }, []);

  const loadNewsFeeds = useCallback(async (isInitial = false) => {
    if (!isInitial && (isLoadingMore || !hasMore)) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ limit: '24' });
      if (cursor) params.append('cursor', cursor);

      const response = await fetch(`/api/feeds?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Feed API error:', response.status, errorText);
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        setNewsFeeds(prev => isInitial ? data.data : [...prev, ...data.data]);
        setCursor(data.nextCursor || null);
        setHasMore(data.hasMore ?? false);
      } else {
        console.warn('Invalid feed data structure:', data);
        setHasMore(false);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load news feeds:', error);
        setHasMore(false);
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [cursor, hasMore, isLoadingMore]);

  useEffect(() => {
    loadNewsFeeds(true);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadNewsFeeds(false);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadNewsFeeds, isLoading]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <article key={i} className="bg-card overflow-hidden border border-border shadow-sm">
            <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="h-5 w-full bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-gray-300 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-2 w-16 bg-primary/20 rounded-full"></div>
                <div className="h-2 w-12 bg-primary/20 rounded-full"></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (newsFeeds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No news feeds available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {newsFeeds.map((feed) => (
          <FeedCard key={feed.id} feed={feed} formatDate={formatDate} />
        ))}
      </div>

      <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading more feeds...</span>
          </div>
        )}
        {!hasMore && newsFeeds.length > 0 && (
          <p className="text-muted-foreground">You've reached the end</p>
        )}
      </div>
    </>
  );
}