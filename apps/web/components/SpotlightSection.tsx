'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, ChevronLeft, ChevronRight, Pause, Play, ExternalLink } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';

/**
 * CINEMATIC IMAGE LAYER
 * Enforces grayscale-to-color transition and depth.
 */
const SpotlightImage = memo(({ feed }: { feed: FeedItem }) => {
  const [imgSrc, setImgSrc] = useState(feed.image);
  const [isLoading, setIsLoading] = useState(true);
  const feedKey = `${feed.url}-${feed.image}`;

  useEffect(() => {
    setImgSrc(feed.image);
    setIsLoading(true);
  }, [feed.image]);

  const handleError = useCallback(() => {
    setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
    setIsLoading(false);
  }, [feed.title]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="absolute inset-0 bg-background overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-muted/5 animate-pulse" />
      )}
      <img
        key={feedKey}
        src={imgSrc}
        alt={feed.title}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms] ease-out ${isLoading ? 'opacity-0 scale-110' : 'opacity-20 grayscale group-hover/spotlight:grayscale-0 group-hover/spotlight:opacity-40 scale-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
      {/* GRADIENT DEPTH: Ensures typography legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
    </div>
  );
});

SpotlightImage.displayName = 'SpotlightImage';

const SlideIndicator = memo(({ 
  index, 
  currentIndex, 
  onClick 
}: { 
  index: number; 
  currentIndex: number; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="h-[2px] transition-all duration-700 ease-in-out bg-border/20 relative overflow-hidden"
    style={{
      width: index === currentIndex ? '4rem' : '1rem',
    }}
    aria-label={`Entry ${index + 1}`}
  >
    {index === currentIndex && (
      <div className="absolute inset-0 bg-primary/40 origin-left animate-progress-fast" />
    )}
  </button>
));

SlideIndicator.displayName = 'SlideIndicator';

/**
 * PRIMARY SIGNAL SURFACE
 * The entry point of the landing page hierarchy.
 */
export default memo(function SpotlightSection({
  initialFeeds,
  initialTrending
}: {
  initialFeeds: FeedItem[];
  initialTrending: FeedItem[];
}) {
  const [currentFeeds, setCurrentFeeds] = useState<FeedItem[]>(initialFeeds);
  const [currentTrending, setCurrentTrending] = useState<FeedItem[]>(initialTrending);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (currentFeeds.length || 1));
  }, [currentFeeds.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (currentFeeds.length || 1)) % (currentFeeds.length || 1));
  }, [currentFeeds.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setIsAutoPlaying(false);
  }, []);

  useEffect(() => {
    if (isAutoPlaying && currentFeeds.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 10000); // Slower pacing for cinematic feel
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, isPaused, goToNext, currentFeeds.length]);

  const currentFeed = useMemo(
    () => currentFeeds[currentIndex] || currentFeeds[0],
    [currentFeeds, currentIndex]
  );

  if (!currentFeeds || currentFeeds.length === 0) {
    return (
      <div className="relative h-[80vh] flex items-center justify-center border border-border/10">
        <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Awaiting Signal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="relative h-[85vh] md:h-[90vh] group/spotlight bg-background border-b border-border/5 overflow-hidden">
        <SpotlightImage feed={currentFeed} />

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-screen-2xl mx-auto px-8 w-full">
            <div className="max-w-4xl space-y-12">
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.6em] text-primary/60 font-semibold block">
                  01 / Top Signal
                </span>
                <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40 font-medium">
                  <span>{currentFeed.source}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span suppressHydrationWarning>
                    {currentFeed.publishedAt && new Date(currentFeed.publishedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    }).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-light tracking-tighter leading-[1] text-balance">
                {currentFeed.title}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground/60 font-light leading-relaxed max-w-2xl line-clamp-2">
                {currentFeed.summary}
              </p>

              <div className="pt-8 flex items-center gap-12">
                {currentFeed.url && (
                  <Link
                    href={currentFeed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-semibold"
                  >
                    <span className="border-b border-foreground/10 group-hover/link:border-primary transition-all pb-2">Full Signal</span>
                    <ExternalLink className="w-3 h-3 opacity-20 group-hover/link:opacity-100 transition-opacity" />
                  </Link>
                )}
                
                <div className="flex gap-4">
                  <button onClick={goToPrevious} className="p-4 border border-border/5 hover:border-border/20 transition-colors">
                    <ChevronLeft className="w-4 h-4 opacity-20" />
                  </button>
                  <button onClick={goToNext} className="p-4 border border-border/5 hover:border-border/20 transition-colors">
                    <ChevronRight className="w-4 h-4 opacity-20" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESSIVE NAVIGATION */}
        <div className="absolute bottom-12 left-8 md:bottom-20 md:left-8 flex gap-6 z-10">
          {currentFeeds.slice(0, 5).map((_, index) => (
            <SlideIndicator
              key={index}
              index={index}
              currentIndex={currentIndex}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* TRANSITIONAL LAYER: Trending Carousel */}
      <div className="max-w-screen-2xl mx-auto px-8 -translate-y-12 relative z-20">
        <div className="bg-background/40 backdrop-blur-3xl border border-border/5 p-12 space-y-8">
          <header className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground/40">
              Vector Pulses
            </span>
          </header>
          <TrendingCarousel feeds={currentTrending} />
        </div>
      </div>
    </div>
  );
});
