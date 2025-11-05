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
  autoAdvanceInterval = 6000,
  className = "",
}: SpotlightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  const goToSlide = useCallback((index: number) => {
    const newIndex = (index + items.length) % items.length;
    setCurrentIndex(newIndex);
    
    if (announceRef.current) {
      announceRef.current.textContent = `Slide ${newIndex + 1} of ${items.length}: ${items[newIndex].title}`;
    }
  }, [items]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      goToNext();
    }

    if (touchStart - touchEnd < -75) {
      goToPrevious();
    }
  };

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Spotlight"
    >
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        ref={announceRef}
      />

      <Link
        href={currentItem.link}
        className="block"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className="bg-[#111111] border-[#1a1a1a] overflow-hidden hover:scale-[1.02] transition-transform duration-300 relative group">
          <div className="relative aspect-[16/9]">
            <ImageWithFallback
              src={currentItem.imageUrl}
              alt={currentItem.title}
              fill
              className="object-cover"
              priority={currentIndex === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {currentItem.tag && (
              <div className="absolute top-4 right-4 bg-[#D7FF3C] text-black px-3 py-1 rounded-full text-xs font-semibold">
                {currentItem.tag}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-xl font-bold mb-1 line-clamp-2">
                {currentItem.title}
              </h3>
              {currentItem.subtitle && (
                <p className="text-sm text-gray-300 line-clamp-2">
                  {currentItem.subtitle}
                </p>
              )}
            </div>
          </div>
        </Card>
      </Link>

      {items.length > 1 && (
        <div className="mt-4">
          <CarouselControls
            currentIndex={currentIndex}
            totalSlides={items.length}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onIndicatorClick={goToSlide}
          />
        </div>
      )}
    </div>
  );
}
