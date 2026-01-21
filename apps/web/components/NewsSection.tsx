'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface IngestionStatus {
  isRunning: boolean;
  hasFailed: boolean;
  lastRun?: string;
  totalItemsNew: number;
}

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

const FeedCard = memo(({ feed, formatDate, index }: { feed: FeedItem; formatDate: (date: string | Date) => string; index: number }) => {
  if (!feed || !feed.title || !feed.url) return null;
  
  const initialImg = feed.image || `/api/fallback-thumb/${encodeURIComponent(feed.id || 'default')}`;
  const [imgSrc, setImgSrc] = useState<string | null>(initialImg);
  
  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative border-b border-[#D1FF3D]/5 pb-20 last:border-0 transition-all hover:bg-[#111111]/40 p-10 -mx-10"
    >
      <Link href={feed.url} target="_blank" rel="noopener noreferrer" className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-12 md:gap-24 items-start">
        <div className="space-y-8 md:space-y-10 order-2 xl:order-1">
          <div className="flex items-center gap-4 md:gap-8 text-[9px] font-mono uppercase tracking-[0.4em] md:tracking-[0.5em] text-muted-foreground/30 font-bold">
            <span className="text-[#D1FF3D]">{feed.source}</span>
            <span className="w-8 md:w-12 h-[1px] bg-[#D1FF3D]/10" />
            <span>{formatDate(feed.publishedAt)}</span>
          </div>

          <motion.h3 
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, x: 5 }}
            className="text-[clamp(1.25rem,4vw,3.5rem)] font-extralight tracking-tighter leading-[1.05] group-hover:text-[#D1FF3D] transition-all duration-700 text-balance line-clamp-2 md:line-clamp-3"
          >
            {feed.title}
          </motion.h3>

          {feed.summary && (
            <p className="text-sm leading-relaxed text-muted-foreground/60 font-light line-clamp-3 max-w-2xl text-balance">
              {feed.summary}
            </p>
          )}

          <div className="flex flex-wrap gap-8 pt-4">
            {feed.tags?.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[8px] font-mono uppercase tracking-[0.6em] text-muted-foreground/20 font-bold group-hover:text-[#D1FF3D]/30 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative aspect-[16/9] overflow-hidden bg-[#111111]/40 order-1 xl:order-2 grayscale transition-all duration-1000 opacity-20 group-hover:opacity-60 group-hover:grayscale-0">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={feed.title}
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
              onError={() => {
                const fallback = `/api/fallback-thumb/${encodeURIComponent(feed.id || 'default')}`;
                if (imgSrc !== fallback) {
                  setImgSrc(fallback);
                } else {
                  setImgSrc(null);
                }
              }}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-px bg-[#D1FF3D]/10" />
            </div>
          )}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-[#0B0B0B]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-8 right-8 p-3 bg-white/5 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700">
            <ArrowUpRight className="w-4 h-4 text-[#D1FF3D]" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
});

FeedCard.displayName = 'FeedCard';

export default function NewsSection() {
  const [newsFeeds, setNewsFeeds] = useState<FeedItem[]>([]);
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatDate = useCallback((date: string | Date) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'SIGNAL';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    } catch {
      return 'SIGNAL';
    }
  }, []);

  const loadNewsFeeds = useCallback(async (isInitial = false) => {
    if (!isInitial && (isLoadingMore || !hasMore)) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: '24', offset: isInitial ? '0' : String(newsFeeds.length) });
      const response = await fetch(`/api/feeds?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        setHasMore(false);
        return;
      }

      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        setNewsFeeds(prev => isInitial ? data.data : [...prev, ...data.data]);
        setIngestionStatus(data.status || null);
        setHasMore(data.hasMore ?? false);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setHasMore(false);
      }
    } finally {
      if (isInitial) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  }, [newsFeeds.length, hasMore, isLoadingMore]);

  useEffect(() => {
    loadNewsFeeds(true);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
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
      { threshold: 0.1, rootMargin: '600px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadNewsFeeds, isLoading]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    newsFeeds.forEach(feed => {
      if (feed.tags) feed.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
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

  if (isLoading) {
    return (
      <div className="space-y-48">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-24 opacity-10">
            <div className="space-y-10">
              <div className="h-4 w-48 bg-[#D1FF3D]/20 animate-pulse" />
              <div className="h-24 w-full bg-[#D1FF3D]/5 animate-pulse" />
              <div className="h-32 w-full bg-[#D1FF3D]/5 animate-pulse" />
            </div>
            <div className="aspect-[16/9] bg-[#D1FF3D]/5 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (newsFeeds.length === 0) {
    return (
      <div className="py-32 md:py-48 flex flex-col items-center justify-center space-y-8">
        <div className="w-12 h-px bg-[#D1FF3D]/10" />
        <span className="text-[10px] font-mono uppercase tracking-[0.8em] text-muted-foreground/20 font-bold">
          Archive Synchronizing
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {allTags.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-24 z-30 bg-[#0B0B0B]/40 backdrop-blur-2xl py-8 border-b border-[#D1FF3D]/5"
        >
          <div className="flex flex-wrap gap-8 items-center">
             <span className="text-[8px] font-mono uppercase tracking-[1em] text-[#D1FF3D]/20 mr-4">Filter</span>
            <button
              onClick={() => setSelectedTags(new Set())}
              className={`text-[9px] font-mono uppercase tracking-[0.5em] px-4 py-2 border transition-all ${selectedTags.size === 0 ? 'bg-[#D1FF3D] text-[#0B0B0B] border-[#D1FF3D]' : 'border-[#D1FF3D]/10 text-muted-foreground hover:border-[#D1FF3D]/30'}`}
            >
              Signal: All
            </button>
            {allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTags(new Set([tag]))}
                className={`text-[9px] font-mono uppercase tracking-[0.5em] px-4 py-2 border transition-all ${selectedTags.has(tag) ? 'bg-[#D1FF3D] text-[#0B0B0B] border-[#D1FF3D]' : 'border-[#D1FF3D]/10 text-muted-foreground hover:border-[#D1FF3D]/30'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {filteredFeeds.length > 0 ? (
        <div className="space-y-0">
          {filteredFeeds.map((feed, index) => (
            <FeedCard key={feed.id} feed={feed} formatDate={formatDate} index={index} />
          ))}
        </div>
      ) : (
        <div className="py-48 flex flex-col items-center justify-center space-y-8 opacity-10">
          <div className="w-16 h-px bg-[#D1FF3D]/20" />
          <span className="text-[9px] font-mono uppercase tracking-[1em]">
            {ingestionStatus?.isRunning ? 'Synchronizing Archive...' : 'Zero Signal Detected'}
          </span>
        </div>
      )}

      <div ref={observerTarget} className="h-64 flex flex-col items-center justify-center gap-6">
        {isLoadingMore && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-px bg-[#D1FF3D]" />
          </div>
        )}
      </div>
    </div>
  );
}
