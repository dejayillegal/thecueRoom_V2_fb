'use client';

import { useEffect, useState, useCallback, useRef, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';

const SpotlightImage = memo(({ feed }: { feed: FeedItem }) => {
  const [imgSrc, setImgSrc] = useState(feed.image);
  const [hasError, setHasError] = useState(false);
  const feedKey = `${feed.url}-${feed.image}`;

  useEffect(() => {
    setImgSrc(feed.image);
    setHasError(false);
  }, [feedKey]);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
    }
  }, [hasError, feed.title]);

  return (
    <Image
      key={feedKey}
      src={imgSrc}
      alt={feed.title}
      fill
      sizes="100vw"
      priority
      quality={85}
      className="object-cover transition-opacity duration-700"
      onError={handleError}
      unoptimized={imgSrc.startsWith('/api/og-fallback')}
    />
  );
});

SpotlightImage.displayName = 'SpotlightImage';

export default function SpotlightSection({
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
  const autoPlayRef = useRef<NodeJS.Timeout>();
  const refreshRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % currentFeeds.length);
  }, [currentFeeds.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + currentFeeds.length) % currentFeeds.length);
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

  useEffect(() => {
    const refreshFeeds = async () => {
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
            url: item.link,
            summary: item.summary || '',
            image: item.image,
            publishedAt: item.publishedAt,
            source: item.source?.name || 'Unknown',
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
              url: item.link,
              summary: item.summary || '',
              image: item.image,
              publishedAt: item.publishedAt,
              source: item.source?.name || 'Unknown',
              tags: item.tags || [],
            }));

          setCurrentTrending(topTrending);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to refresh feeds:', error);
        }
      }
    };

    refreshRef.current = setInterval(refreshFeeds, 3600000);

    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (isAutoPlaying && currentFeeds.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 5000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isPaused, goToNext, currentFeeds.length]);

  if (!currentFeeds || currentFeeds.length === 0) {
    return (
      <div className="relative h-[60vh] bg-card rounded-lg flex items-center justify-center border border-border">
        <p className="text-muted-foreground">No spotlight feeds available yet.</p>
      </div>
    );
  }

  const currentFeed = currentFeeds[currentIndex] || currentFeeds[0];

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Spotlight</h2>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Live Updates</span>
        </div>
      </div>

      <div className="relative h-[50vh] md:h-[60vh] bg-card rounded-xl overflow-hidden border border-border shadow-lg group/spotlight">
        <div className="relative w-full h-full">
          <SpotlightImage feed={currentFeed} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute top-4 left-4 right-4 opacity-0 group-hover/spotlight:opacity-100 transition-opacity">
          <div className="text-sm font-medium text-white drop-shadow-lg">
            {currentFeed.source}
          </div>
          <div className="text-xs text-white/90 drop-shadow-lg" suppressHydrationWarning>
            {currentFeed.publishedAt && (() => {
              const date = new Date(currentFeed.publishedAt);
              return `${date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}`;
            })()}
          </div>
        </div>

        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover/spotlight:opacity-100 transition-opacity hover:bg-background/90 z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover/spotlight:opacity-100 transition-opacity hover:bg-background/90 z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={toggleAutoPlay}
          className="absolute right-4 top-4 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover/spotlight:opacity-100 transition-opacity hover:bg-background/90 z-10"
          aria-label={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-3xl">
            <div className="text-xs text-primary mb-2">{currentFeed.source}</div>
            <h2 className="text-2xl md:text-4xl font-bold mb-2 line-clamp-2">{currentFeed.title}</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-2">{currentFeed.summary}</p>
            {currentFeed.url && (
              <Link
                href={currentFeed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base"
              >
                Read More
              </Link>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {currentFeeds.slice(0, 8).map((feed, index) => (
            <button
              key={`${feed.url}-${index}`}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 md:mt-8">
        <h3 className="text-xl font-bold mb-4">Trending Now</h3>
        <TrendingCarousel feeds={currentTrending} />
      </div>
    </section>
  );
}