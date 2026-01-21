'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
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

const TrendingCard = memo(({ feed }: { feed: FeedItem }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(feed.image || null);
  const [isLoading, setIsLoading] = useState(true);

  const resolvedSrc = imgSrc || (feed.title ? `/api/og-fallback?title=${encodeURIComponent(feed.title)}` : null);

  return (
    <Link
      href={feed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group flex-shrink-0 w-64 md:w-80 border-r border-[#D1FF3D]/5 pr-12 last:border-0"
    >
      <div className="space-y-6">
        <div className="relative aspect-[16/10] bg-[#111111] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
          {isLoading && <div className="absolute inset-0 bg-[#111111] animate-pulse" />}
          {resolvedSrc && (
            <img
              src={resolvedSrc}
              alt={feed.title}
              className={`w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105 contrast-125 brightness-110 ${isLoading ? 'opacity-0' : ''}`}
              onError={() => {
                const fallback = feed.title ? `/api/og-fallback?title=${encodeURIComponent(feed.title)}` : null;
                if (imgSrc !== fallback) {
                  setImgSrc(fallback);
                } else {
                  setImgSrc(null);
                }
              }}
              onLoad={() => setIsLoading(false)}
            />
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#D1FF3D]/40 font-bold">{feed.source}</span>
            <div className="h-px w-8 bg-[#D1FF3D]/10" />
          </div>
          <h4 className="text-sm font-light line-clamp-2 leading-tight tracking-tight italic opacity-60 group-hover:opacity-100 transition-opacity">
            {feed.title}
          </h4>
        </div>
      </div>
    </Link>
  );
});

TrendingCard.displayName = 'TrendingCard';

export default function TrendingCarousel({ feeds }: { feeds: FeedItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const container = scrollRef.current;
    if (!container) return;

    let scrollPos = 0;
    const step = () => {
      if (isPaused) return;
      scrollPos += 0.4;
      if (scrollPos >= container.scrollWidth / 2) scrollPos = 0;
      container.scrollLeft = scrollPos;
      requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPaused]);

  if (!feeds?.length) return null;

  return (
    <div 
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={scrollRef}
        className="flex gap-12 overflow-x-hidden pb-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {[...feeds, ...feeds].map((feed, index) => (
          <TrendingCard key={`${feed.url}-${index}`} feed={feed} />
        ))}
      </div>
    </div>
  );
}
