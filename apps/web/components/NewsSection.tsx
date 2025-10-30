'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <article className="bg-card overflow-hidden border border-border hover:border-primary/30 transition-all group shadow-sm hover:shadow-md">
      <Link href={feed.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative">
          <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
            )}
            <img
              src={imgSrc}
              alt={feed.title}
              className={`w-full h-full object-cover transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
                setIsLoading(false);
              }}
              loading="lazy"
            />
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium truncate max-w-[60%]">
              {feed.source || 'Unknown Source'}
            </span>
            <span>{formatDate(feed.publishedAt)}</span>
          </div>

          <h3 className="text-sm font-bold line-clamp-2 text-foreground group-hover:text-[#D7FF3C] group-hover:underline transition-colors duration-200 leading-tight">
            {feed.title}
          </h3>

          {feed.summary && (
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {feed.summary}
            </p>
          )}

          {feed.tags && feed.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {feed.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] font-medium text-[#D7FF3C] border border-[#D7FF3C]/30 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
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
      if (!feed.tags || feed.tags.length === 0) return false;
      const feedTags = feed.tags.map(t => t.toLowerCase());
      return Array.from(selectedTags).some(selectedTag => feedTags.includes(selectedTag));
    });
  }, [newsFeeds, selectedTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTags(new Set());
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <article key={i} className="bg-card overflow-hidden border border-border shadow-sm">
            <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="h-5 w-full bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-gray-300 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-primary/20 rounded"></div>
                <div className="h-5 w-12 bg-primary/20 rounded"></div>
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
      {allTags.length > 0 && (
        <div className="mb-6 border border-border bg-card p-4">
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span className="text-[#D7FF3C]">⚡</span>
              Filter by Category
              {selectedTags.size > 0 && (
                <span className="text-xs text-[#D7FF3C] ml-2">({selectedTags.size} active)</span>
              )}
            </h3>
            {isFiltersExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {isFiltersExpanded && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                      selectedTags.has(tag)
                        ? 'border-[#D7FF3C] bg-[#D7FF3C]/10 text-[#D7FF3C]'
                        : 'border-[#D7FF3C]/30 text-[#D7FF3C] hover:bg-[#D7FF3C]/5'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              
              {selectedTags.size > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-[#D7FF3C] transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFeeds.map((feed) => (
          <FeedCard key={feed.id} feed={feed} formatDate={formatDate} />
        ))}
      </div>

      {filteredFeeds.length === 0 && selectedTags.size > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No feeds match the selected filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-[#D7FF3C] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading more feeds...</span>
          </div>
        )}
        {!hasMore && filteredFeeds.length > 0 && (
          <p className="text-muted-foreground">You've reached the end</p>
        )}
      </div>
    </>
  );
}
