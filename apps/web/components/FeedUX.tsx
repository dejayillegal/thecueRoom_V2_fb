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

const FeedCard = memo(({ item, formatDate }: { item: FeedItem; formatDate: (d: string) => string }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.98, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] } as any}
      className="group relative flex flex-col gap-8 p-6 transition-all duration-700 hover:bg-white/[0.02]"
    >
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative aspect-[16/10] overflow-hidden bg-[#0B0B0B] ring-1 ring-white/5 transition-all duration-700 group-hover:ring-white/10 group-hover:shadow-[0_0_80px_-20px_rgba(209,255,61,0.15)]">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 mix-blend-luminosity group-hover:grayscale-0 group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-1000 ease-out scale-110 group-hover:scale-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/fallbacks/fallback_1.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/20 to-transparent opacity-80" />
        
        {/* Hover Accent Line */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D1FF3D] origin-left transition-transform duration-700"
        />
      </a>
      
      <div className="space-y-6 relative">
        <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-[0.5em] text-[#D1FF3D]/40 group-hover:text-[#D1FF3D]/80 transition-colors duration-500">
          <span className="px-2 py-0.5 border border-[#D1FF3D]/20 rounded-sm">{item.source}</span>
          <span className="w-1 h-1 rounded-full bg-[#D1FF3D]/20" />
          <time dateTime={item.publishedAt}>
            {formatDate(item.publishedAt)}
          </time>
        </div>
        
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group/title">
          <h3 className="text-3xl md:text-4xl font-extralight tracking-tight leading-[1.1] transition-all duration-700 group-hover/title:text-[#D1FF3D] group-hover/title:translate-x-1">
            {item.title}
          </h3>
        </a>
        
        <p className="text-sm font-light leading-relaxed text-foreground/30 line-clamp-3 italic transition-colors duration-700 group-hover:text-foreground/60">
          {item.summary}
        </p>

        {/* Dynamic Shadow Element */}
        <div className="absolute -inset-10 bg-[#D1FF3D]/[0.02] opacity-0 blur-3xl rounded-full transition-opacity duration-1000 group-hover:opacity-100 pointer-events-none" />
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only fetch if we don't have initial items to avoid double loading on mount
    if (initialItems.length === 0) {
      fetchFeeds(0);
    }
  }, [fetchFeeds, initialItems.length]);

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

  const formatDate = (dateStr: string) => {
    if (!mounted) return ""; // Prevent hydration mismatch
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
            <FeedCard key={item.id} item={item} formatDate={formatDate} />
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
