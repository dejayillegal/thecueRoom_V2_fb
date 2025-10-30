
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
  publishedAt: Date;
  source: string | null;
}

const FeedCard = memo(({ feed, formatDate }: { feed: FeedItem; formatDate: (date: Date) => string }) => {
  const [imgSrc, setImgSrc] = useState(feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <article className="bg-card overflow-hidden border border-border hover:border-primary/50 transition-all group rounded-lg">
      <Link href={feed.url} target="_blank" rel="noopener noreferrer">
        <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
          )}
          <img
            src={imgSrc}
            alt={feed.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
              setIsLoading(false);
            }}
            loading="lazy"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span className="font-medium text-primary truncate max-w-[60%]">
                  {feed.source || 'Unknown Source'}
                </span>
                <span className="text-[10px] sm:text-xs">{formatDate(feed.publishedAt)}</span>
              </div>
              
              <h3 className="text-sm sm:text-base md:text-lg font-semibold line-clamp-2 text-white group-hover:text-primary transition-colors">
                {feed.title}
              </h3>
              
              {feed.summary && (
                <p className="text-xs sm:text-sm text-white/70 line-clamp-2 hidden sm:block">
                  {feed.summary}
                </p>
              )}
              
              {feed.tags && feed.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1">
                  {feed.tags.slice(0, 3).map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-primary/20 text-primary border border-primary/30 rounded"
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
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        setNewsFeeds(prev => isInitial ? data.data : [...prev, ...data.data]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load news feeds:', error);
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
          <article key={i} className="bg-card overflow-hidden border border-border rounded-lg">
            <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
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
