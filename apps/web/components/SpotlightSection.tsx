'use client';

import { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface SpotlightFeedItem {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  image: string | null;
  tags: string[] | null;
  publishedAt: string | Date;
  source: string;
}

export default memo(function SpotlightSection({
  initialFeeds,
}: {
  initialFeeds: SpotlightFeedItem[];
}) {
  const [currentFeeds] = useState<SpotlightFeedItem[]>(initialFeeds || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (currentFeeds.length || 1));
  }, [currentFeeds.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (currentFeeds.length || 1)) % (currentFeeds.length || 1));
  }, [currentFeeds.length]);

  useEffect(() => {
    if (currentFeeds.length > 1 && !isPaused) {
      autoPlayRef.current = setInterval(goToNext, 12000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, goToNext, currentFeeds.length]);

  const currentFeed = useMemo(
    () => currentFeeds[currentIndex] || currentFeeds[0],
    [currentFeeds, currentIndex]
  );

  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 500], [0, 50]);
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  if (!currentFeeds || currentFeeds.length === 0 || !currentFeed) {
    return (
      <section className="relative h-[40vh] md:h-[50vh] flex flex-col items-center justify-center bg-[#0B0B0B] border-b border-[#D1FF3D]/5">
        <div className="space-y-6 text-center px-10">
          <div className="w-12 h-px bg-[#D1FF3D]/20 mx-auto" />
          <p className="text-[10px] font-mono uppercase tracking-[0.6em] text-[#D1FF3D]/40 font-bold">
            No signals available yet
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="relative">
      <section className="relative h-[60vh] md:h-[85vh] group/spotlight bg-[#0B0B0B] overflow-hidden" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <AnimatePresence mode="wait">
          <SpotlightImage key={currentFeed.url} feed={currentFeed} />
        </AnimatePresence>

        <motion.div 
          style={{ y: titleY, opacity: contentOpacity }}
          className="absolute inset-0 flex items-end pb-12 md:pb-32"
        >
          <div className="max-w-screen-2xl mx-auto px-6 md:px-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 md:gap-24 items-end">
              <div className="space-y-6 md:space-y-12">
                <motion.div 
                  key={`meta-${currentIndex}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="flex items-center gap-4 md:gap-6 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.4em] md:tracking-[0.6em] text-[#D1FF3D] font-bold">
                    <span>{currentFeed.source}</span>
                    <span className="w-6 md:w-8 h-px bg-[#D1FF3D]/20" />
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
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[clamp(1.75rem,8vw,6rem)] font-extralight tracking-tighter leading-[0.95] text-balance line-clamp-2 md:line-clamp-3 overflow-hidden"
                >
                  {currentFeed.title}
                </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="flex items-center gap-6 md:gap-12 pt-4 md:pt-12"
                >
                  {currentFeed.url && (
                    <Link
                      href={currentFeed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-center gap-4 md:gap-6 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.4em] md:tracking-[0.8em] font-bold text-foreground"
                    >
                      <span className="border-b border-transparent group-hover:border-[#D1FF3D] transition-all pb-1 md:pb-2">Read more</span>
                    </Link>
                  )}
                  
                  <div className="flex gap-3 md:gap-4 ml-4 md:ml-8">
                    <button onClick={goToPrevious} className="p-2 md:p-3 border border-white/5 hover:border-[#D1FF3D]/20 transition-all opacity-40 hover:opacity-100">
                      <ChevronLeft className="w-3 md:w-4 h-3 md:h-4" />
                    </button>
                    <button onClick={goToNext} className="p-2 md:p-3 border border-white/5 hover:border-[#D1FF3D]/20 transition-all opacity-40 hover:opacity-100">
                      <ChevronRight className="w-3 md:w-4 h-3 md:h-4" />
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
                  {currentFeed.tags?.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#D1FF3D]/60">#{tag}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* INDICATORS */}
        <div className="absolute bottom-12 right-6 sm:right-10 flex flex-col gap-4 z-10 items-end">
          <div className="flex flex-col gap-4">
            {currentFeeds.slice(0, 5).map((_, index) => (
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
    </div>
  );
});
