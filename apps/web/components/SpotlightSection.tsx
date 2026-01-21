'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, ExternalLink } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

/**
 * CINEMATIC VECTOR LAYER
 * Motion: Subtle slow zoom and grayscale-to-color transition.
 * Philosophy: Ink settling on paper.
 */
const SpotlightImage = memo(({ feed, index }: { feed: FeedItem; index: number }) => {
  const [imgSrc, setImgSrc] = useState(feed.image);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(feed.image);
    setIsLoading(true);
  }, [feed.image]);

  return (
    <motion.div 
      initial={{ scale: 1.1, filter: "grayscale(100%)", opacity: 0 }}
      animate={{ scale: 1, filter: "grayscale(70%)", opacity: 1 }}
      exit={{ scale: 1.05, opacity: 0 }}
      transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ 
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0B0B0B',
        overflow: 'hidden'
      }}
    >
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111111' }} className="animate-pulse" />
      )}
      <motion.img
        src={imgSrc}
        alt={feed.title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.1,
          filter: 'grayscale(100%)'
        }}
        className="group-hover/spotlight:grayscale-0 group-hover/spotlight:opacity-25 transition-all duration-[3000ms]"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
          setIsLoading(false);
        }}
      />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to top, #0B0B0B, rgba(11, 11, 11, 0.4), transparent)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(11, 11, 11, 0.6), transparent, transparent)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', backgroundImage: 'linear-gradient(to right, transparent, rgba(209, 255, 61, 0.1), transparent)' }} />
    </motion.div>
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
    style={{
      height: '1px',
      transition: 'all 1000ms ease-in-out',
      position: 'relative',
      overflow: 'hidden',
      width: index === currentIndex ? '6rem' : '1.5rem',
      backgroundColor: index === currentIndex ? '#D1FF3D' : 'rgba(209, 255, 61, 0.1)',
    }}
    aria-label={`Entry ${index + 1}`}
  >
    {index === currentIndex && (
      <motion.div 
        layoutId="indicator"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#D1FF3D'
        }}
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 12, ease: "linear" }}
      />
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

  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 500], [0, 100]);
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  if (!currentFeeds || currentFeeds.length === 0) {
    return (
      <div className="relative h-[70vh] flex flex-col items-center justify-center border border-[#D1FF3D]/5 space-y-8">
        <div className="w-16 h-px bg-[#D1FF3D]/20 animate-pulse" />
        <span className="text-[9px] font-mono uppercase tracking-[1em] text-muted-foreground animate-pulse">Establishing Signal</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative h-[85vh] group/spotlight bg-[#0B0B0B] border-b border-[#D1FF3D]/5 overflow-hidden">
        <AnimatePresence mode="wait">
          <SpotlightImage key={currentFeed.url} feed={currentFeed} index={currentIndex} />
        </AnimatePresence>

        <motion.div 
          style={{ y: titleY, opacity: contentOpacity }}
          className="absolute inset-0 flex items-end pb-32"
        >
          <div className="max-w-screen-2xl mx-auto px-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-24 items-end">
              <div className="space-y-12">
                <motion.div 
                  key={`meta-${currentIndex}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <div className="flex items-center gap-6 text-[9px] font-mono uppercase tracking-[0.5em] text-[#D1FF3D] font-bold">
                    <span>{currentFeed.source}</span>
                    <span className="w-6 h-px bg-[#D1FF3D]/20" />
                    <span suppressHydrationWarning>
                      {currentFeed.publishedAt && new Date(currentFeed.publishedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      }).toUpperCase()}
                    </span>
                  </div>
                </motion.div>
                
                <motion.h1 
                  key={`title-${currentIndex}`}
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 1.2, delay: 0.6 }}
                  className="text-6xl md:text-9xl font-extralight tracking-tighter leading-[0.85] text-balance"
                >
                  {currentFeed.title}
                </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  className="flex items-center gap-12 pt-8"
                >
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
                </motion.div>
              </div>

              <motion.div 
                key={`summary-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="hidden lg:block space-y-8 border-l border-[#D1FF3D]/10 pl-12 pb-4"
              >
                <p className="text-sm font-light leading-relaxed line-clamp-4">
                  {currentFeed.summary}
                </p>
                <div className="flex gap-4">
                  {currentFeed.tags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#D1FF3D]/40">#{tag}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

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
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="max-w-screen-2xl mx-auto px-10 -translate-y-16 relative z-20"
      >
        <div className="bg-[#111111]/80 backdrop-blur-3xl border border-[#D1FF3D]/5 p-16 space-y-12">
          <header className="flex items-center gap-8">
            <span className="text-[9px] font-mono uppercase tracking-[1em] font-bold text-[#D1FF3D]/20">
              Active Vectors
            </span>
            <div className="h-px flex-1 bg-[#D1FF3D]/5" />
          </header>
          {currentTrending.length > 0 ? (
            <TrendingCarousel feeds={currentTrending} />
          ) : (
            <div className="h-24 flex items-center justify-center opacity-10">
               <span className="text-[8px] font-mono uppercase tracking-[1em]">Scanning Network</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
});
