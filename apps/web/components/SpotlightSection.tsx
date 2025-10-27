
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';

function sanitizeImageUrl(url: string | null | undefined, title: string): string {
  if (!url) {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }
  
  // Filter out YouTube embeds and invalid URLs
  if (url.includes('youtube.com/embed') || url.includes('youtu.be')) {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }
  
  // Check if it's a valid image URL
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  if (!imageExtensions.test(url) && !url.includes('og:image') && !url.includes('twitter:image')) {
    return `/api/og-fallback?title=${encodeURIComponent(title.slice(0, 120))}`;
  }
  
  return url;
}

// Advanced trending algorithm - prioritizes recent + diversity
function calculateTrendingScore(item: any, index: number): number {
  const now = Date.now();
  const publishedTime = new Date(item.publishedAt).getTime();
  const ageInHours = (now - publishedTime) / (1000 * 60 * 60);
  
  // Recency score (decays over 48 hours)
  const recencyScore = Math.max(0, 100 - (ageInHours / 48) * 100);
  
  // Diversity bonus (prefer varied sources)
  const diversityBonus = index % 3 === 0 ? 20 : 0;
  
  // Tag richness (more tags = more engaging)
  const tagScore = Math.min(30, (item.tags?.length || 0) * 5);
  
  return recencyScore + diversityBonus + tagScore;
}

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
      try {
        // Fetch spotlight feeds (top 8 for hero carousel)
        const spotlightResponse = await fetch('/api/feeds?limit=8');
        
        // Fetch trending feeds (16 items from offset 8)
        const trendingResponse = await fetch('/api/feeds?limit=32&offset=0');
        
        if (spotlightResponse.ok) {
          const spotlightData = await spotlightResponse.json();
          if (spotlightData.data && spotlightData.data.length > 0) {
            const formattedFeeds = spotlightData.data.map((item: any) => ({
              title: item.title,
              url: item.link,
              summary: item.summary || '',
              image: sanitizeImageUrl(item.image, item.title),
              publishedAt: item.publishedAt,
              source: item.source?.name || 'Unknown',
              tags: item.tags || [],
            }));
            setCurrentFeeds(formattedFeeds);
          }
        }
        
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json();
          if (trendingData.data && trendingData.data.length > 0) {
            // Apply trending algorithm
            const scoredItems = trendingData.data.map((item: any, index: number) => ({
              ...item,
              trendingScore: calculateTrendingScore(item, index)
            }));
            
            // Sort by trending score and take top 16
            const topTrending = scoredItems
              .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
              .slice(0, 16)
              .map((item: any) => ({
                title: item.title,
                url: item.link,
                summary: item.summary || '',
                image: sanitizeImageUrl(item.image, item.title),
                publishedAt: item.publishedAt,
                source: item.source?.name || 'Unknown',
                tags: item.tags || [],
              }));
            
            setCurrentTrending(topTrending);
          }
        }
      } catch (error) {
        console.error('Failed to refresh feeds:', error);
      }
    };

    // Initial refresh
    refreshFeeds();
    
    // Refresh every hour
    const interval = setInterval(refreshFeeds, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAutoPlaying && currentFeeds.length > 1) {
      autoPlayRef.current = setInterval(goToNext, 5000);
      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [isAutoPlaying, goToNext, currentFeeds.length]);

  if (!currentFeeds || currentFeeds.length === 0) {
    return (
      <div className="relative h-[60vh] bg-card rounded-lg flex items-center justify-center border border-border">
        <p className="text-muted-foreground">No spotlight feeds available yet. Run the ingestion script to populate feeds.</p>
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
          <Image
            key={currentFeed.url}
            src={currentFeed.image}
            alt={currentFeed.title}
            fill
            sizes="100vw"
            priority
            quality={85}
            className="object-cover transition-opacity duration-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `/api/og-fallback?title=${encodeURIComponent(currentFeed.title.slice(0, 120))}`;
            }}
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 opacity-0 group-hover/spotlight:opacity-100 transition-opacity">
          <div className="text-sm font-medium text-white drop-shadow-lg">
            {currentFeed.source}
          </div>
          <div className="text-xs text-white/90 drop-shadow-lg">
            {currentFeed.publishedAt && new Date(currentFeed.publishedAt).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
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
          {currentFeeds.slice(0, 8).map((_, index) => (
            <button
              key={index}
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
