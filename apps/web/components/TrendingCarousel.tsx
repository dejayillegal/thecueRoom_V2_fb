'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!feeds || feeds.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
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
                className="object-cover group-hover/card:scale-105 transition-transform"
              />
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