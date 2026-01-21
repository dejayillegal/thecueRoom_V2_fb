"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CarouselControls } from "@/components/ui/CarouselControls";
import { ImageWithFallback } from "@/components/ImageWithFallback";

export interface SpotlightItemProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
  tag?: string;
}

interface SpotlightCarouselProps {
  items: SpotlightItemProps[];
  autoAdvanceInterval?: number;
  className?: string;
}

export function SpotlightCarousel({
  items,
  autoAdvanceInterval = 5000,
  className = "",
}: SpotlightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const announceRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = (index + items.length) % items.length;
    setCurrentIndex(newIndex);
    
    if (announceRef.current) {
      announceRef.current.textContent = `Slide ${newIndex + 1} of ${items.length}: ${items[newIndex].title}`;
    }

    // Match transition duration
    setTimeout(() => setIsTransitioning(false), 500);
  }, [items, isTransitioning]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (!isPaused && items.length > 1) {
      intervalRef.current = setInterval(() => {
        goToNext();
      }, autoAdvanceInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, autoAdvanceInterval, goToNext, items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative ${className} group/spotlight`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Spotlight"
    >
      <div className="relative overflow-hidden rounded-3xl aspect-[21/9] sm:aspect-[24/9]">
        <div 
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, idx) => (
            <div key={item.id} className="min-w-full h-full relative group">
              <Link href={item.link} className="block h-full">
                <div className="relative h-full w-full">
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={idx === 0}
                  />
                  {/* Overlay layers */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                  
                  {item.tag && (
                    <div className="absolute top-6 right-6 bg-[#D7FF3C] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-[0_0_20px_rgba(215,255,60,0.3)] z-20">
                      {item.tag}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 p-8 sm:p-12 text-white z-10 max-w-2xl transform transition-transform duration-500 group-hover:translate-x-2">
                    <h3 className="text-2xl sm:text-4xl font-black mb-3 line-clamp-2 leading-tight tracking-tight">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-sm sm:text-base text-gray-300 line-clamp-2 font-medium opacity-90">
                        {item.subtitle}
                      </p>
                    )}
                    
                    <div className="mt-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#D7FF3C]">Explore Content</span>
                      <div className="w-12 h-[1px] bg-[#D7FF3C]/50" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Navigation Overlays */}
        {items.length > 1 && (
          <>
            <button 
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/spotlight:opacity-100 transition-all hover:bg-[#D7FF3C] hover:text-black z-20"
            >
              ←
            </button>
            <button 
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/spotlight:opacity-100 transition-all hover:bg-[#D7FF3C] hover:text-black z-20"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Progress Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-6 right-8 flex gap-2 z-20">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-1 transition-all duration-500 rounded-full ${
                idx === currentIndex ? "w-8 bg-[#D7FF3C]" : "w-4 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
