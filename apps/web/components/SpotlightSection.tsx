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
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className="absolute inset-0 bg-[#0B0B0B] overflow-hidden"
    >
      {isLoading && <div className="absolute inset-0 bg-[#111111] animate-pulse" />}
        <motion.img
          src={imgSrc}
          alt={feed.title}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-25 contrast-[1.1] transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-50"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImgSrc(`/api/fallback-thumb/${encodeURIComponent((feed as any).id || 'default')}`);
            setIsLoading(false);
          }}
        />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/60 to-transparent" />
      {/* Subtle Glow Overlay */}
      <div className="absolute inset-0 z-10 border border-white/0 group-hover:border-[#D1FF3D]/10 group-hover:shadow-[0_0_40px_-10px_rgba(209,255,61,0.1)] transition-all duration-700" />
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
          className="absolute inset-0 flex items-start pt-32"
        >
          <div className="max-w-screen-2xl mx-auto px-10 w-full pt-12 md:pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-12 items-start">
              <div className="space-y-12 w-full">
                <motion.div key={`meta-${currentIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.6em] text-[#D1FF3D] font-bold">
                    <span>{currentFeed.source}</span>
                    <span className="w-8 h-px bg-[#D1FF3D]/20" />
                    <span>{new Date(currentFeed.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</span>
                  </div>
                </motion.div>
                <motion.h1 
                  key={`title-${currentIndex}`} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4, delay: 0.1 }} 
                  className="text-2xl md:text-5xl lg:text-7xl font-light tracking-tighter leading-[0.95] text-pretty group-hover:text-white transition-colors duration-500 break-words max-w-none md:max-w-[1400px]"
                >
                  {currentFeed.title}
                </motion.h1>
                <motion.div 
                  key={`summary-${currentIndex}`} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 0.5 }} 
                  transition={{ duration: 0.4, delay: 0.2 }} 
                  className="space-y-8 border-l border-[#D1FF3D]/10 pl-8 md:pl-16 mb-4 group-hover:opacity-80 transition-opacity duration-500 max-w-2xl"
                >
                  <p className="text-xs md:text-sm font-light leading-relaxed line-clamp-3 italic">{currentFeed.summary}</p>
                </motion.div>
                <div className="flex items-center justify-between w-full pt-4 md:pt-8">
                  <div className="flex items-center gap-8 md:gap-12">
                    <Link href={currentFeed.url} target="_blank" className="group/link flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.8em] font-bold text-foreground focus:outline-none">
                      <span className="border-b border-transparent group-hover:border-[#D1FF3D] transition-all pb-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 focus:border-[#D1FF3D] focus:opacity-100 focus:translate-y-0">Read more →</span>
                    </Link>
                    <div className="flex gap-4 relative z-[60]">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          goToPrevious();
                        }} 
                        className="p-3 border border-white/10 bg-[#0B0B0B]/20 hover:border-[#D1FF3D]/40 transition-all opacity-60 hover:opacity-100 cursor-pointer pointer-events-auto backdrop-blur-sm"
                        title="Previous Signal"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          goToNext();
                        }} 
                        className="p-3 border border-white/10 bg-[#0B0B0B]/20 hover:border-[#D1FF3D]/40 transition-all opacity-60 hover:opacity-100 cursor-pointer pointer-events-auto backdrop-blur-sm"
                        title="Next Signal"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute bottom-12 right-10 md:static flex flex-col md:flex-row gap-4 z-10 items-end md:items-center">
                    {currentFeeds.slice(0, 5).map((_, index) => (
                      <SlideIndicator key={index} index={index} currentIndex={currentIndex} onClick={() => setCurrentIndex(index)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
});
