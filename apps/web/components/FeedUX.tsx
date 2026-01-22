'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  publishedAt: string;
  source: string;
  tags?: string[];
}

interface FeedAPIResponse {
  items: FeedItem[];
  total: number;
  hydrated: boolean;
  error?: string;
}

const FeedSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="space-y-6 animate-pulse">
        <div className="aspect-video bg-[#D1FF3D]/5" />
        <div className="space-y-3">
          <div className="h-4 w-24 bg-[#D1FF3D]/10" />
          <div className="h-8 w-full bg-[#D1FF3D]/5" />
          <div className="h-4 w-2/3 bg-[#D1FF3D]/5" />
        </div>
      </div>
    ))}
  </div>
);

const FeedCard = memo(({ item, formatDate }: { item: FeedItem; formatDate: (d: string) => string }) => {
  return (
    <motion.article
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col gap-6 py-8 border-b border-white/5 last:border-0"
    >
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative aspect-[16/10] overflow-hidden bg-[#0B0B0B] block">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/fallbacks/fallback_1.png';
            }}
          />
        </a>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-[#D1FF3D]/60">
            <span>{item.source}</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <time dateTime={item.publishedAt}>
              {formatDate(item.publishedAt)}
            </time>
          </div>
          
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="text-2xl md:text-3xl font-light tracking-tight leading-snug group-hover:text-[#D1FF3D] transition-colors duration-200 text-balance">
              {item.title}
            </h3>
          </a>
          
          <p className="text-sm font-light leading-relaxed text-foreground/40 line-clamp-2 text-balance">
            {item.summary}
          </p>
        </div>
      </div>
    </motion.article>
  );
});

FeedCard.displayName = 'FeedCard';

interface FeedUXProps {
  initialItems?: FeedItem[];
  initialHasMore?: boolean;
}

export default function FeedUX({ initialItems = [], initialHasMore = true }: FeedUXProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialItems.length);
  const loadingRef = useRef(false);

  const fetchFeeds = useCallback(async (currentOffset: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/feeds?offset=${currentOffset}&limit=12`);
      const result: FeedAPIResponse = await response.json();
      
      if (result.error && currentOffset === 0 && (!result.items || result.items.length === 0)) {
        setError(result.error);
        return;
      }

      if (currentOffset === 0) {
        setItems(result.items || []);
        setOffset(result.items?.length || 0);
      } else {
        setItems(prev => {
          const newItems = result.items || [];
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));
          return [...prev, ...uniqueNewItems];
        });
        setOffset(prev => prev + (result.items?.length || 0));
      }
      setHasMore(result.items?.length === 12);
      setError(null);
    } catch (err) {
      console.error('Feed fetch error:', err);
      if (currentOffset === 0 && items.length === 0) {
        setError('Transmission Error');
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [items.length]);

  const observerRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return "";
    }
  };

  return (
    <AnimatePresence mode="wait">
      {items.length === 0 && error ? (
        <motion.div 
          key="error"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          style={{}}
          className="h-[40vh] flex flex-col items-center justify-center space-y-8 text-center"
        >
          <p className="text-sm font-mono uppercase tracking-[0.5em] text-[#D1FF3D]">{error}</p>
        </motion.div>
      ) : (
        <div className="flex flex-col">
          <motion.div 
            key="content"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{}}
            className="flex flex-col"
          >
            {items.map((item) => (
              <FeedCard key={item.id} item={item} formatDate={formatDate} />
            ))}
          </motion.div>
          {hasMore && (
            <div className="flex justify-center mt-24">
              <button 
                onClick={() => fetchFeeds(offset)}
                disabled={isLoading}
                className="text-[10px] font-mono uppercase tracking-[0.4em] px-8 py-4 border border-white/10 hover:border-[#D1FF3D] hover:text-[#D1FF3D] transition-all duration-200 disabled:opacity-20"
              >
                {isLoading ? 'Syncing...' : 'Fetch More Signals'}
              </button>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
