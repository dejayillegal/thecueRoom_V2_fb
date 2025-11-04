
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ImageWithFallback } from '@/../../src/components/ImageWithFallback';
import { Loader2 } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  image: string;
  source: string;
  tags: string[];
  publishedAt: string;
}

interface NewsListProps {
  filters: {
    search: string;
    tags: string[];
  };
}

export function NewsList({ filters }: NewsListProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchNews = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('limit', '24');
      params.set('offset', reset ? '0' : offset.toString());
      
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.tags.length > 0) {
        params.set('tags', filters.tags.join(','));
      }

      const response = await fetch(`/api/feeds?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Expected JSON response');
      }

      const data = await response.json();
      const newItems = data.data || [];

      if (reset) {
        setItems(newItems);
        setOffset(newItems.length);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setOffset(prev => prev + newItems.length);
      }

      setHasMore(newItems.length === 24);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  // Reset when filters change
  useEffect(() => {
    setOffset(0);
    fetchNews(true);
  }, [filters]);

  // Loading State
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#D1FF3D]" />
      </div>
    );
  }

  // Error State
  if (error && items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchNews(true)}
          className="px-4 py-2 bg-[#D1FF3D] text-black rounded hover:bg-[#b8e035] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty State
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No news found</p>
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
                  <span className="text-[#D1FF3D]">{item.source}</span>
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
            onClick={() => fetchNews(false)}
            className="px-6 py-2 bg-[#D1FF3D] text-black rounded hover:bg-[#b8e035] transition-colors"
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
