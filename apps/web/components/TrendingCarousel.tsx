'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import { OptimizedImage } from './OptimizedImage';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Image from 'next/image';

export interface FeedItem {
  title: string;
  url: string;
  summary: string;
  image: string;
  publishedAt: string;
  source: string;
  tags: string[];
}

const TrendingCard = memo(({ feed, index }: { feed: FeedItem; index: number }) => {
  const [imgSrc, setImgSrc] = useState(feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const newSrc = feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`;
    setImgSrc(newSrc);
    setIsLoading(true);
    setHasError(false);
  }, [feed.image, feed.title]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
    }
    setIsLoading(false);
  };

  return (
    <Link
      href={feed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group flex-shrink-0 w-56 sm:w-64 md:w-72"
    >
      <div className="bg-card overflow-hidden border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
        <div className="p-2.5 sm:p-3 bg-card">
          <h4 className="text-xs sm:text-sm font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {feed.title}
          </h4>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <span className="truncate">{feed.source}</span>
          </div>
        </div>
        <div className="relative h-36 sm:h-40 md:h-44 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
          )}
          <img
            src={imgSrc}
            alt={feed.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={handleError}
            onLoad={() => setIsLoading(false)}
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/0 group-hover:bg-black/25 transition-colors duration-300"></div>
        </div>
      </div>
    </Link>
  );
});

TrendingCard.displayName = 'TrendingCard';

export default function TrendingCarousel({ feeds }: { feeds: FeedItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const autoScroll = useCallback(() => {
    if (scrollRef.current && isAutoScrolling && !isPaused) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: 1, behavior: 'auto' });
      }

      rafRef.current = requestAnimationFrame(autoScroll);
    }
  }, [isAutoScrolling, isPaused]);

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll, { passive: true });
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [checkScroll]);

  useEffect(() => {
    if (isAutoScrolling && !isPaused) {
      rafRef.current = requestAnimationFrame(autoScroll);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isAutoScrolling, isPaused, autoScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isAutoScrolling) {
      setIsPaused(false);
    }
  }, [isAutoScrolling]);

  if (!feeds || feeds.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {isPaused ? 'Paused' : 'Auto-scrolling'}
          </span>
        </div>
        <button
          onClick={toggleAutoScroll}
          className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
          aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>
      </div>

      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {feeds.map((feed, index) => (
          <TrendingCard key={`${feed.url}-${index}`} feed={feed} index={index} />
        ))}
      </div>
    </div>
  );
}