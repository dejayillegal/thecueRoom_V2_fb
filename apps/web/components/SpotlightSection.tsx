'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, ExternalLink } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';

/**
 * CINEMATIC VECTOR LAYER
 * Restrained abstraction. Depth via silence.
 */
const SpotlightImage = memo(({ feed }: { feed: FeedItem }) => {
  const [imgSrc, setImgSrc] = useState(feed.image);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(feed.image);
    setIsLoading(true);
  }, [feed.image]);

  return (
    <div className="absolute inset-0 bg-[#0B0B0B] overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-[#111111] animate-pulse" />
      )}
      <img
        src={imgSrc}
        alt={feed.title}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] ease-out ${isLoading ? 'opacity-0 scale-105 blur-2xl' : 'opacity-10 grayscale group-hover/spotlight:grayscale-0 group-hover/spotlight:opacity-25 scale-100 blur-0'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
          setIsLoading(false);
        }}
      />
      {/* SPATIAL TENSION GRADIENTS */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/60 via-transparent to-transparent" />
      
      {/* ABSTRACT ACCENT */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D1FF3D]/10 to-transparent" />
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
    className="h-[1px] transition-all duration-1000 ease-in-out relative overflow-hidden"
    style={{
      width: index === currentIndex ? '6rem' : '1.5rem',
      backgroundColor: index === currentIndex ? '#D1FF3D' : 'rgba(209, 255, 61, 0.1)',
    }}
    aria-label={`Entry ${index + 1}`}
  />
));

SlideIndicator.displayName = 'SlideIndicator';

/**
 * PRIMARY SIGNAL SURFACE
 * Information as Architecture.
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

  useEffect(() => {
    if (isAutoPlaying && currentFeeds.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 12000);
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
      <div className="relative h-[70vh] flex items-center justify-center border border-[#D1FF3D]/5">
        <span className="text-[9px] font-mono uppercase tracking-[1em] text-muted-foreground animate-pulse">Establishing Signal...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative h-[85vh] group/spotlight bg-[#0B0B0B] border-b border-[#D1FF3D]/5 overflow-hidden">
        <SpotlightImage feed={currentFeed} />

        <div className="absolute inset-0 flex items-end pb-32">
          <div className="max-w-screen-2xl mx-auto px-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-24 items-end">
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-6 text-[9px] font-mono uppercase tracking-[0.5em] text-[#D1FF3D] font-bold">
                    <span>{currentFeed.source}</span>
                    <span className="w-6 h-px bg-[#D1FF3D]/20" />
                    <span suppressHydrationWarning>
                      {currentFeed.publishedAt && new Date(currentFeed.publishedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      }).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <h1 className="text-6xl md:text-9xl font-extralight tracking-tighter leading-[0.85] text-balance">
                  {currentFeed.title}
                </h1>
                
                <div className="flex items-center gap-12 pt-8">
                  {currentFeed.url && (
                    <Link
                      href={currentFeed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-center gap-6 text-[9px] font-mono uppercase tracking-[0.8em] font-bold text-foreground"
                    >
                      <span className="border-b border-transparent group-hover:border-[#D1FF3D] transition-all pb-2">Full Vector</span>
                    </Link>
                  )}
                  
                  <div className="flex gap-2">
                    <button onClick={goToPrevious} className="p-4 border border-white/5 hover:border-[#D1FF3D]/20 transition-all">
                      <ChevronLeft className="w-4 h-4 opacity-20" />
                    </button>
                    <button onClick={goToNext} className="p-4 border border-white/5 hover:border-[#D1FF3D]/20 transition-all">
                      <ChevronRight className="w-4 h-4 opacity-20" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block space-y-8 border-l border-[#D1FF3D]/10 pl-12 pb-4">
                <p className="text-sm text-muted-foreground/40 font-light leading-relaxed line-clamp-4">
                  {currentFeed.summary}
                </p>
                <div className="flex gap-4">
                  {currentFeed.tags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#D1FF3D]/40">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ASYMMETRIC INDICATORS */}
        <div className="absolute top-32 right-10 flex flex-col gap-6 z-10 items-end">
           <span className="text-[8px] font-mono uppercase tracking-[1em] text-[#D1FF3D]/20 rotate-90 translate-y-12">Flow</span>
           <div className="flex flex-col gap-3 mt-12">
            {currentFeeds.slice(0, 4).map((_, index) => (
              <SlideIndicator
                key={index}
                index={index}
                currentIndex={currentIndex}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* TRENDING OVERLAY */}
      <div className="max-w-screen-2xl mx-auto px-10 -translate-y-16 relative z-20">
        <div className="bg-[#111111]/80 backdrop-blur-3xl border border-[#D1FF3D]/5 p-16 space-y-12">
          <header className="flex items-center gap-8">
            <span className="text-[9px] font-mono uppercase tracking-[1em] font-bold text-[#D1FF3D]/20">
              Active Vectors
            </span>
            <div className="h-px flex-1 bg-[#D1FF3D]/5" />
          </header>
          <TrendingCarousel feeds={currentTrending} />
        </div>
      </div>
    </div>
  );
});
