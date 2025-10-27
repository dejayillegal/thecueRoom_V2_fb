'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export interface FeedItem {
  title: string;
  url: string;
  summary: string;
  image: string;
  publishedAt: string;
  source: string;
  tags: string[];
}

export default function TrendingCarousel({ feeds }: { feeds: FeedItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout>();
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
    if (scrollRef.current && isAutoScrolling) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      
      // If reached the end, reset to beginning
      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Smooth continuous scroll (1px every 50ms = ~20px/second)
        scrollRef.current.scrollBy({ left: 1, behavior: 'auto' });
      }
    }
  }, [isAutoScrolling]);

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [checkScroll]);

  useEffect(() => {
    if (isAutoScrolling && !isPaused) {
      autoScrollRef.current = setInterval(autoScroll, 50);
      return () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current);
        }
      };
    }
  }, [isAutoScrolling, isPaused, autoScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const toggleAutoScroll = () => {
    setIsPaused(!isPaused);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (isAutoScrolling) {
      setIsPaused(false);
    }
  };

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
      >
        {feeds.map((feed, index) => (
          <Link
            key={`${feed.url}-${index}`}
            href={feed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-72 bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group/card"
          >
            <div className="relative h-40">
              <Image
                src={feed.image}
                alt={feed.title}
                fill
                sizes="288px"
                loading="lazy"
                quality={80}
                className="object-cover group-hover/card:scale-105 transition-transform"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-xs font-medium text-white drop-shadow-lg">
                    {feed.source}
                  </div>
                  <div className="text-xs text-white/90 drop-shadow-lg">
                    {new Date(feed.publishedAt).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-sm line-clamp-2 group-hover/card:text-primary transition-colors">
                {feed.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-2">
                {feed.source}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}