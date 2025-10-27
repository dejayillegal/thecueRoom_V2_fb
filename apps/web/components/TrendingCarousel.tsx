
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(feeds.length - 4, 1));
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, [feeds.length]);

  useEffect(() => {
    if (carouselRef.current) {
      const scrollWidth = carouselRef.current.scrollWidth / feeds.length;
      carouselRef.current.scrollTo({
        left: scrollWidth * currentIndex,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, feeds.length]);

  if (!feeds || feeds.length === 0) {
    return null;
  }

  const visibleFeeds = feeds.slice(currentIndex, currentIndex + 5);
  if (visibleFeeds.length < 5 && feeds.length >= 5) {
    const remaining = 5 - visibleFeeds.length;
    visibleFeeds.push(...feeds.slice(0, remaining));
  }

  return (
    <div className="relative">
      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visibleFeeds.map((feed, index) => (
          <div
            key={`${feed.url}-${index}`}
            className="flex-shrink-0 w-64 snap-start"
          >
            <Link
              href={feed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="relative h-32 rounded-lg overflow-hidden bg-card border border-border">
                <Image
                  src={feed.image}
                  alt={feed.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="256px"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">
                    {feed.title}
                  </h4>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      {feeds.length > 5 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(feeds.length - 4, 8) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex % Math.min(feeds.length - 4, 8)
                  ? 'bg-primary w-8'
                  : 'bg-border hover:bg-muted-foreground'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
