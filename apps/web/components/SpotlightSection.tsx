'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const SpotlightImage = memo(({ feed }: { feed: FeedItem }) => {
  const [imgSrc, setImgSrc] = useState(feed.image);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(feed.image);
    setIsLoading(true);
  }, [feed.image]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-[#0B0B0B] overflow-hidden"
    >
      {isLoading && <div className="absolute inset-0 bg-[#111111] animate-pulse" />}
      <motion.img
        src={imgSrc}
        alt={feed.title}
        className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale contrast-[1.2]"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(`/api/fallback-thumb/${encodeURIComponent((feed as any).id || 'default')}`);
          setIsLoading(false);
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/60 to-transparent" />
    </motion.div>
  );
});

SpotlightImage.displayName = 'SpotlightImage';

const SlideIndicator = memo(({ index, currentIndex, onClick }: { index: number; currentIndex: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`h-[1px] transition-all duration-700 relative overflow-hidden ${index === currentIndex ? 'w-24 bg-[#D1FF3D]' : 'w-6 bg-[#D1FF3D]/10 hover:bg-[#D1FF3D]/30'}`}
    aria-label={`Entry ${index + 1}`}
  >
    {index === currentIndex && (
      <motion.div 
        layoutId="indicator"
        className="absolute inset-0 bg-[#D1FF3D]"
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 12, ease: "linear" }}
      />
    )}
  </button>
));

SlideIndicator.displayName = 'SlideIndicator';

export default memo(function SpotlightSection({ initialFeeds = [], initialTrending = [] }: { initialFeeds?: FeedItem[]; initialTrending?: FeedItem[] }) {
  const [currentFeeds, setCurrentFeeds] = useState<FeedItem[]>(initialFeeds);
  const [currentTrending, setCurrentTrending] = useState<FeedItem[]>(initialTrending);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<any>(null);

  useEffect(() => {
    if (currentFeeds.length === 0) {
      fetch('/api/feeds?limit=5')
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            setCurrentFeeds(data.items);
            setCurrentTrending(data.items);
          }
        })
        .catch(console.error);
    }
  }, [currentFeeds.length]);

  const goToNext = useCallback(() => {
    if (currentFeeds.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % currentFeeds.length);
  }, [currentFeeds]);

  const goToPrevious = useCallback(() => {
    if (currentFeeds.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + currentFeeds.length) % currentFeeds.length);
  }, [currentFeeds]);

  useEffect(() => {
    if (currentFeeds.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 12000);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isPaused, goToNext, currentFeeds.length]);

  const currentFeed = useMemo(() => currentFeeds[currentIndex] || null, [currentFeeds, currentIndex]);
  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 500], [0, 50]);
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  if (!currentFeed && currentFeeds.length === 0) {
    return (
      <div className="h-[85vh] bg-[#0B0B0B] flex items-center justify-center">
        <span className="text-[10px] font-mono uppercase tracking-[1em] text-[#D1FF3D]/20 animate-pulse">Syncing Network</span>
      </div>
    );
  }

  if (!currentFeed) return null;

  return (
    <div className="relative">
      <section 
        className="relative h-[85vh] group bg-[#0B0B0B] overflow-hidden" 
        onMouseEnter={() => setIsPaused(true)} 
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <SpotlightImage key={currentFeed.url} feed={currentFeed} />
        </AnimatePresence>

        <motion.div 
          style={{ y: titleY, opacity: contentOpacity }}
          className="absolute inset-0 flex items-end pb-32"
        >
          <div className="max-w-screen-2xl mx-auto px-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-24 items-end">
              <div className="space-y-12">
                <motion.div key={`meta-${currentIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.6em] text-[#D1FF3D] font-bold">
                    <span>{currentFeed.source}</span>
                    <span className="w-8 h-px bg-[#D1FF3D]/20" />
                    <span>{new Date(currentFeed.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</span>
                  </div>
                </motion.div>
                <motion.h1 key={`title-${currentIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="text-6xl md:text-8xl xl:text-9xl font-light tracking-tighter leading-[0.9] text-balance">
                  {currentFeed.title}
                </motion.h1>
                <div className="flex items-center gap-12 pt-12">
                  <Link href={currentFeed.url} target="_blank" className="group/link flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.8em] font-bold text-foreground">
                    <span className="border-b border-transparent group-hover:border-[#D1FF3D] transition-all pb-2">Read more</span>
                  </Link>
                  <div className="flex gap-4 ml-8">
                    <button onClick={goToPrevious} className="p-3 border border-white/5 hover:border-[#D1FF3D]/20 transition-all opacity-40 hover:opacity-100"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={goToNext} className="p-3 border border-white/5 hover:border-[#D1FF3D]/20 transition-all opacity-40 hover:opacity-100"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              <motion.div key={`summary-${currentIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ duration: 0.2 }} className="hidden lg:block space-y-8 border-l border-[#D1FF3D]/10 pl-16 mb-4">
                <p className="text-sm font-light leading-relaxed line-clamp-3 italic opacity-80">{currentFeed.summary}</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-12 right-10 flex flex-col gap-4 z-10 items-end">
          {currentFeeds.slice(0, 5).map((_, index) => (
            <SlideIndicator key={index} index={index} currentIndex={currentIndex} onClick={() => setCurrentIndex(index)} />
          ))}
        </div>
      </section>

      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} className="max-w-screen-2xl mx-auto px-10 -translate-y-24 relative z-20">
        <div className="bg-[#0B0B0B]/60 backdrop-blur-3xl border border-[#D1FF3D]/5 p-20 shadow-2xl">
          <header className="flex items-center gap-12 mb-12">
            <span className="text-[10px] font-mono uppercase tracking-[1.2em] font-bold text-[#D1FF3D]/40">Active Vectors</span>
            <div className="h-px flex-1 bg-[#D1FF3D]/5" />
          </header>
          {currentTrending.length > 0 ? (
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
