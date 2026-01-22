'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
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
  data: FeedItem[];
  hasMore: boolean;
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

const FeedCard = memo(({ item }: { item: FeedItem }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] } as any}
      className="group flex flex-col gap-6"
    >
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative aspect-video overflow-hidden bg-[#0B0B0B]">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 ease-in-out scale-100 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent opacity-60" />
      </a>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-[0.4em] text-[#D1FF3D]/60">
          <span>{item.source}</span>
          <span>/</span>
          <time dateTime={item.publishedAt}>
            {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>
        
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group/title">
          <h3 className="text-2xl md:text-3xl font-extralight tracking-tight leading-tight transition-colors group-hover/title:text-[#D1FF3D] decoration-[#D1FF3D]/30 underline-offset-8 group-hover/title:underline">
            {item.title}
          </h3>
        </a>
        
        <p className="text-sm font-light leading-relaxed text-foreground/40 line-clamp-2 italic">
          {item.summary}
        </p>
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
      
      if (result.error && currentOffset === 0 && (!result.data || result.data.length === 0)) {
        setError(result.error);
        return;
      }

      if (currentOffset === 0) {
        setItems(result.data || []);
        setOffset(result.data?.length || 0);
      } else {
        setItems(prev => {
          const newItems = result.data || [];
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));
          return [...prev, ...uniqueNewItems];
        });
        setOffset(prev => prev + (result.data?.length || 0));
      }
      setHasMore(result.hasMore);
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

  const { ref, inView } = useInView({ 
    threshold: 0.1,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasMore && !isLoading && !error && items.length > 0) {
      fetchFeeds(offset);
    }
  }, [inView, hasMore, isLoading, error, offset, fetchFeeds, items.length]);

  return (
    <AnimatePresence mode="wait">
      {items.length === 0 && error ? (
        <motion.div 
          key="error"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="h-[40vh] flex flex-col items-center justify-center space-y-8 text-center"
        >
          <p className="text-sm font-mono uppercase tracking-[0.5em] text-[#D1FF3D]">{error}</p>
        </motion.div>
      ) : (
        <motion.div 
          key="content"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24"
        >
          {items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
          {hasMore && (
            <div ref={ref} className="col-span-full h-32 flex items-center justify-center mt-24">
              <div className="h-8 w-8 border-2 border-[#D1FF3D]/20 border-t-[#D1FF3D] rounded-full animate-spin" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
