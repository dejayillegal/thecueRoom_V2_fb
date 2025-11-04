
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/../../src/components/ui/skeleton';
import { ImageWithFallback } from '@/../../src/components/ImageWithFallback';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import type { NewsFilterValues } from './NewsFilters';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  image: string | null;
  tags: string[];
  publishedAt: string;
  sourceId: string;
  sourceName: string;
}

interface NewsListProps {
  filters: NewsFilterValues;
}

function NewsItemSkeleton() {
  return (
    <Card className="bg-[#111111] border-[#1a1a1a] overflow-hidden">
      <Skeleton className="aspect-video w-full bg-[#1a1a1a]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 bg-[#1a1a1a]" />
        <Skeleton className="h-4 w-full bg-[#1a1a1a]" />
        <Skeleton className="h-4 w-2/3 bg-[#1a1a1a]" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20 bg-[#1a1a1a]" />
          <Skeleton className="h-3 w-16 bg-[#1a1a1a]" />
        </div>
      </div>
    </Card>
  );
}

export function NewsList({ filters }: NewsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const updateURLParams = useCallback((newFilters: NewsFilterValues) => {
    const params = new URLSearchParams();
    
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));
    if (newFilters.platform && newFilters.platform !== 'all') params.set('platform', newFilters.platform);
    if (newFilters.sort && newFilters.sort !== 'latest') params.set('sort', newFilters.sort);
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom);
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo);
    if (newFilters.verifiedOnly) params.set('verifiedOnly', 'true');

    const newURLParams = params.toString();
    const currentURLParams = searchParams.toString();
    
    if (newURLParams !== currentURLParams) {
      const newURL = newURLParams ? `?${newURLParams}` : '';
      router.push(newURL, { scroll: false });
    }
  }, [router, searchParams]);

  const fetchNews = useCallback(async (reset = false, cursor?: string | null) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('limit', '24');
      
      if (cursor) {
        params.set('cursor', cursor);
      }
      
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.tags.length > 0) {
        params.set('tags', filters.tags.join(','));
      }
      if (filters.platform && filters.platform !== 'all') {
        params.set('platform', filters.platform);
      }
      if (filters.sort) {
        params.set('sort', filters.sort);
      }
      if (filters.dateFrom) {
        params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.set('dateTo', filters.dateTo);
      }
      if (filters.verifiedOnly) {
        params.set('verifiedOnly', 'true');
      }

      const response = await fetch(`/api/news/list?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch news: ${response.status}`);
      }

      const data = await response.json();
      const newItems = data.items || [];

      if (reset) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }

      setNextCursor(data.nextCursor || null);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
      if (reset) {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Reset and fetch when filters change
  useEffect(() => {
    updateURLParams(filters);
    setNextCursor(null);
    fetchNews(true);
  }, [filters, updateURLParams, fetchNews]);

  // Loading Skeleton State
  if (loading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <NewsItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error State
  if (error && items.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-white text-lg font-semibold mb-2">Failed to Load News</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => fetchNews(true)}
          className="px-6 py-2.5 bg-[#D1FF3D] text-black rounded-lg hover:bg-[#b8e035] transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty State
  if (items.length === 0) {
    const hasActiveFilters = filters.search || filters.tags.length > 0 || filters.platform || filters.dateFrom || filters.dateTo || filters.verifiedOnly;
    
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-xl font-semibold mb-2">
          {hasActiveFilters ? 'No News Found' : 'No News Available'}
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {hasActiveFilters
            ? 'Try adjusting your filters to see more results.'
            : 'Check back later for the latest news and updates from the music industry.'}
        </p>
        {hasActiveFilters && (
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="bg-[#111111] border-[#1a1a1a] overflow-hidden hover:border-[#333333] transition-colors"
          >
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              {item.image && (
                <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    fallbackSrc="/fallback-thumbnail.png"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-white font-medium mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {item.summary}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#D1FF3D]">{item.sourceName}</span>
                  <span className="text-gray-500">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => fetchNews(false, nextCursor)}
            className="px-6 py-2.5 bg-[#D1FF3D] text-black rounded-lg hover:bg-[#b8e035] transition-colors font-medium"
          >
            Load More
          </button>
        </div>
      )}

      {/* Loading More */}
      {loading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#D1FF3D]" />
        </div>
      )}
    </div>
  );
}
