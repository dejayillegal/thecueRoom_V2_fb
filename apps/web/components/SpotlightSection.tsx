'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, ChevronLeft, ChevronRight, Pause, Play, ExternalLink } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';

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
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        key={feedKey}
        src={imgSrc}
        alt={feed.title}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${isLoading ? 'opacity-0 scale-110' : 'opacity-60 grayscale group-hover/spotlight:grayscale-0 group-hover/spotlight:opacity-80 scale-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
    </div>
  );
});

SpotlightImage.displayName = 'SpotlightImage';

const NavigationButton = memo(({ 
  direction, 
  onClick, 
  label 
}: { 
  direction: 'left' | 'right';
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`absolute ${direction}-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-border/40 bg-background/20 backdrop-blur-sm opacity-0 group-hover/spotlight:opacity-100 transition-all hover:bg-background/80 hover:border-border z-10`}
    aria-label={label}
  >
    {direction === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
  </button>
));

NavigationButton.displayName = 'NavigationButton';

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
    className="h-1 transition-all duration-500 ease-in-out bg-border/40 hover:bg-border relative group/indicator"
    style={{
      width: index === currentIndex ? '3rem' : '1.5rem',
    }}
    aria-label={`Go to slide ${index + 1}`}
  >
    {index === currentIndex && (
      <div className="absolute inset-0 bg-primary origin-left animate-progress-fast" />
    )}
  </button>
));

SlideIndicator.displayName = 'SlideIndicator';

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
  const refreshRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
    setIsPaused((prev) => !prev);
  }, []);

  const refreshFeeds = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const [spotlightRes, trendingRes] = await Promise.all([
        fetch('/api/feeds?limit=8', {
          signal: abortControllerRef.current.signal,
          headers: { 'Accept': 'application/json' }
        }),
        fetch('/api/feeds?limit=32&offset=0', {
          signal: abortControllerRef.current.signal,
          headers: { 'Accept': 'application/json' }
        })
      ]);

      if (!spotlightRes.ok || !trendingRes.ok) return;

      const [spotlightData, trendingData] = await Promise.all([
        spotlightRes.json(),
        trendingRes.json()
      ]);

      if (spotlightData.data && spotlightData.data.length > 0) {
        const formattedFeeds = spotlightData.data.map((item: any) => ({
          title: item.title,
          url: item.url,
          summary: item.summary || '',
          image: item.image,
          publishedAt: item.publishedAt,
          source: item.source || 'Unknown',
          tags: item.tags || [],
        }));
        setCurrentFeeds(formattedFeeds);
      }

      if (trendingData.data && trendingData.data.length > 0) {
        const scoredItems = trendingData.data.map((item: any, index: number) => {
          const now = Date.now();
          const publishedTime = new Date(item.publishedAt).getTime();
          const ageInHours = (now - publishedTime) / (1000 * 60 * 60);

          const recencyScore = Math.max(0, 100 - (ageInHours / 48) * 100);
          const diversityBonus = index % 3 === 0 ? 20 : 0;
          const tagScore = Math.min(30, (item.tags?.length || 0) * 5);

          return {
            ...item,
            trendingScore: recencyScore + diversityBonus + tagScore
          };
        });

        const topTrending = scoredItems
          .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
          .slice(0, 16)
          .map((item: any) => ({
            title: item.title,
            url: item.url,
            summary: item.summary || '',
            image: item.image,
            publishedAt: item.publishedAt,
            source: item.source || 'Unknown',
            tags: item.tags || [],
          }));

        setCurrentTrending(topTrending);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to refresh feeds:', error);
      }
    }
  }, []);

  useEffect(() => {
    refreshRef.current = setInterval(refreshFeeds, 3600000);

    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshFeeds]);

  useEffect(() => {
    if (isAutoPlaying && currentFeeds.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 8000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isPaused, goToNext, currentFeeds.length]);

  const currentFeed = useMemo(
    () => currentFeeds[currentIndex] || currentFeeds[0],
    [currentFeeds, currentIndex]
  );

  const visibleIndicators = useMemo(
    () => currentFeeds.slice(0, 8),
    [currentFeeds]
  );

  if (!currentFeeds || currentFeeds.length === 0) {
    return (
      <div className="relative h-[60vh] flex items-center justify-center border border-border border-dashed">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Standing by for signal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div className="relative h-[65vh] md:h-[75vh] group/spotlight bg-background border border-border/40 overflow-hidden">
        <SpotlightImage feed={currentFeed} />

        <NavigationButton direction="left" onClick={goToPrevious} label="Previous Signal" />
        <NavigationButton direction="right" onClick={goToNext} label="Next Signal" />

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-primary font-medium">
              <span className="px-2 py-0.5 border border-primary/30 bg-primary/5">{currentFeed.source}</span>
              <span className="text-muted-foreground/60" suppressHydrationWarning>
                {currentFeed.publishedAt && new Date(currentFeed.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-6xl font-light tracking-tight leading-[1.1] text-balance">
              {currentFeed.title}
            </h2>
            
            <p className="text-sm md:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl line-clamp-3">
              {currentFeed.summary}
            </p>

            <div className="pt-4 flex items-center gap-8">
              {currentFeed.url && (
                <Link
                  href={currentFeed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-medium"
                >
                  <span className="border-b border-foreground/20 group-hover/link:border-primary transition-colors pb-1">Read Full Entry</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover/link:text-primary transition-colors" />
                </Link>
              )}
              
              <button
                onClick={toggleAutoPlay}
                className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 md:bottom-16 md:right-16 flex gap-4">
          {visibleIndicators.map((feed, index) => (
            <SlideIndicator
              key={`${feed.url}-${index}`}
              index={index}
              currentIndex={currentIndex}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>

      <section className="space-y-8">
        <header className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground">
            Current Vectors
          </h3>
        </header>
        <TrendingCarousel feeds={currentTrending} />
      </section>
    </div>
  );
});
