'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';

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

const FeedCard = memo(({ feed, formatDate }: { feed: FeedItem; formatDate: (date: string | Date) => string }) => {
  const [imgSrc, setImgSrc] = useState(feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <article className="group relative border-b border-border/40 pb-12 last:border-0 hover:bg-muted/5 transition-colors p-6 -mx-6">
      <Link href={feed.url} target="_blank" rel="noopener noreferrer" className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-12 items-start">
        <div className="space-y-6 order-2 md:order-1">
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
            <span className="text-primary">{feed.source}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{formatDate(feed.publishedAt)}</span>
          </div>

          <h3 className="text-xl md:text-2xl font-light tracking-tight leading-snug group-hover:text-primary transition-colors">
            {feed.title}
          </h3>

          {feed.summary && (
            <p className="text-sm leading-relaxed text-muted-foreground font-light line-clamp-3">
              {feed.summary}
            </p>
          )}

          <div className="flex flex-wrap gap-4 pt-2">
            {feed.tags?.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden bg-muted order-1 md:order-2 grayscale group-hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100">
          <img
            src={imgSrc}
            alt={feed.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
              setIsLoading(false);
            }}
            loading="lazy"
          />
          <div className="absolute top-4 right-4 p-2 bg-background/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-white" />
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
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatDate = useCallback((date: string | Date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHours < 24) return `${diffHours}H AGO`;
    if (diffDays < 7) return `${diffDays}D AGO`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
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

      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        setNewsFeeds(prev => isInitial ? data.data : [...prev, ...data.data]);
        setCursor(data.nextCursor || null);
        setHasMore(data.hasMore ?? false);
      } else {
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
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadNewsFeeds, isLoading]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    newsFeeds.forEach(feed => {
      if (feed.tags) {
        feed.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
      }
    });
    return Array.from(tagSet).sort();
  }, [newsFeeds]);

  const filteredFeeds = useMemo(() => {
    if (selectedTags.size === 0) return newsFeeds;
    return newsFeeds.filter(feed => {
      if (!feed.tags) return false;
      const feedTags = feed.tags.map(t => t.toLowerCase());
      return Array.from(selectedTags).some(selectedTag => feedTags.includes(selectedTag));
    });
  }, [newsFeeds, selectedTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) newSet.delete(tag);
      else newSet.add(tag);
      return newSet;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-24">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-12 animate-pulse">
            <div className="space-y-6">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded" />
              <div className="h-24 w-full bg-muted rounded" />
            </div>
            <div className="aspect-[16/10] bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {allTags.length > 0 && (
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md py-4 border-b border-border/10">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedTags(new Set())}
              className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1 border transition-colors ${selectedTags.size === 0 ? 'bg-foreground text-background border-foreground' : 'border-border/40 text-muted-foreground hover:border-border'}`}
            >
              All Signals
            </button>
            {allTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1 border transition-colors ${selectedTags.has(tag) ? 'bg-primary text-primary-foreground border-primary' : 'border-border/40 text-muted-foreground hover:border-border'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-12">
        {filteredFeeds.map((feed) => (
          <FeedCard key={feed.id} feed={feed} formatDate={formatDate} />
        ))}
      </div>

      <div ref={observerTarget} className="h-40 flex items-center justify-center">
        {isLoadingMore ? (
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Syncing...</span>
        ) : !hasMore && filteredFeeds.length > 0 ? (
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/30">End of stream</span>
        ) : null}
      </div>
    </div>
  );
}
