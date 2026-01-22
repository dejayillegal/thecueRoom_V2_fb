'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

/**
 * CINEMATIC VECTOR LAYER
 */
const SpotlightImage = memo(({ feed }: { feed: FeedItem }) => {
  const [imgSrc, setImgSrc] = useState(feed.image);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(feed.image);
    setIsLoading(true);
  }, [feed.image]);

  return (
    <motion.div 
      initial={{ scale: 1.05, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.02, opacity: 0 }}
      transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'absolute', inset: 0, backgroundColor: '#0B0B0B', overflow: 'hidden' }}
    >
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111111' }} className="animate-pulse" />
      )}
      <motion.img
        src={imgSrc}
        alt={feed.title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, filter: 'grayscale(1) contrast(1.5) brightness(1.1)' }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title)}`);
          setIsLoading(false);
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0B0B0B, rgba(11, 11, 11, 0.2), transparent)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(11, 11, 11, 0.6), transparent, transparent)' }} />
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
      transition: 'all 700ms ease-in-out', 
      position: 'relative', 
      overflow: 'hidden', 
      width: index === currentIndex ? '6rem' : '1.5rem', 
      backgroundColor: index === currentIndex ? '#D1FF3D' : 'rgba(209, 255, 61, 0.1)' 
    }}
    className="hover:bg-[#D1FF3D]/30"
    aria-label={`Entry ${index + 1}`}
  >
    {index === currentIndex && (
      <motion.div 
        layoutId="indicator"
        style={{ position: 'absolute', inset: 0, backgroundColor: '#D1FF3D' }}
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
  const [currentFeeds] = useState<FeedItem[]>(initialFeeds || []);
  const [currentTrending] = useState<FeedItem[]>(initialTrending || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<any>(null);

  const goToNext = useCallback(() => {
    if (!currentFeeds || currentFeeds.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % currentFeeds.length);
  }, [currentFeeds]);

  const goToPrevious = useCallback(() => {
    if (!currentFeeds || currentFeeds.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + currentFeeds.length) % currentFeeds.length);
  }, [currentFeeds]);

  useEffect(() => {
    if (Array.isArray(currentFeeds) && currentFeeds.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 12000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, goToNext, currentFeeds]);

  const currentFeed = useMemo(
    () => (Array.isArray(currentFeeds) && currentFeeds.length > 0) ? (currentFeeds[currentIndex] || currentFeeds[0]) : null,
    [currentFeeds, currentIndex]
  );

  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 500], [0, 50]);
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  if (!currentFeed) return null;

  return (
    <div className="relative">
      <section className="relative h-[60vh] md:h-[85vh] group/spotlight bg-[#0B0B0B] overflow-hidden" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <AnimatePresence mode="wait">
          <SpotlightImage key={currentFeed.url} feed={currentFeed} />
        </AnimatePresence>

        <motion.div 
          style={{ y: titleY as any, opacity: contentOpacity as any }}
          className="absolute inset-0 flex items-end pb-16 md:pb-32"
        >
          <div className="max-w-screen-2xl mx-auto px-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-24 items-end">
              <div className="space-y-12">
                <motion.div 
                  key={`meta-${currentIndex}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.6em] text-[#D1FF3D] font-bold">
                    <span>{currentFeed.source}</span>
                    <span className="w-8 h-px bg-[#D1FF3D]/20" />
                    <span suppressHydrationWarning>
                      {currentFeed.publishedAt && new Date(currentFeed.publishedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric'
                      }).toUpperCase()}
                    </span>
                  </div>
                </motion.div>
                
                <motion.h1 
                  key={`title-${currentIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] } as any}
                  className="text-5xl sm:text-6xl md:text-[8rem] xl:text-[10rem] font-extralight tracking-tighter leading-[0.9] text-balance line-clamp-3"
                >
                  {currentFeed.title}
                </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="flex items-center gap-12 pt-8 sm:pt-12"
                >
                  {currentFeed.url && (
                    <Link
                      href={currentFeed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.8em] font-bold text-foreground"
                    >
                      <span className="border-b border-transparent group-hover:border-[#D1FF3D] transition-all pb-2">Read more</span>
                    </Link>
                  )}
                  
                  <div className="flex gap-4 ml-8">
                    <button onClick={goToPrevious} className="p-3 border border-white/5 hover:border-[#D1FF3D]/20 transition-all opacity-40 hover:opacity-100">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={goToNext} className="p-3 border border-white/5 hover:border-[#D1FF3D]/20 transition-all opacity-40 hover:opacity-100">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                key={`summary-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 1, delay: 1 }}
                className="hidden lg:block space-y-8 border-l border-[#D1FF3D]/10 pl-16 mb-4"
              >
                <p className="text-sm font-light leading-relaxed line-clamp-3 italic opacity-80">
                  {currentFeed.summary}
                </p>
                <div className="flex gap-6">
                  {Array.isArray(currentFeed.tags) && currentFeed.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#D1FF3D]/60">#{tag}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-12 right-10 flex flex-col gap-4 z-10 items-end">
          <div className="flex flex-col gap-4">
            {Array.isArray(currentFeeds) && currentFeeds.slice(0, 5).map((_, index) => (
              <SlideIndicator
                key={index}
                index={index}
                currentIndex={currentIndex}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.2 }}
        className="max-w-screen-2xl mx-auto px-10 -translate-y-24 relative z-20"
      >
        <div className="bg-[#0B0B0B]/60 backdrop-blur-3xl border border-[#D1FF3D]/5 p-20 shadow-2xl">
          <header className="flex items-center gap-12 mb-12">
            <span className="text-[10px] font-mono uppercase tracking-[1.2em] font-bold text-[#D1FF3D]/40">
              Active Vectors
            </span>
            <div className="h-px flex-1 bg-[#D1FF3D]/5" />
          </header>
          {Array.isArray(currentTrending) && currentTrending.length > 0 ? (
            <TrendingCarousel feeds={currentTrending} />
          ) : (
            <div className="h-32 flex items-center justify-center opacity-10">
               <span className="text-[9px] font-mono uppercase tracking-[1em] animate-pulse">Scanning Network</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
});
