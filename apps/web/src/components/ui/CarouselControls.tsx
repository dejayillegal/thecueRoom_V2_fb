"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface CarouselControlsProps {
  currentIndex: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onIndicatorClick: (index: number) => void;
  className?: string;
}

export function CarouselControls({
  currentIndex,
  totalSlides,
  onPrevious,
  onNext,
  onIndicatorClick,
  className = "",
}: CarouselControlsProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        aria-label="Previous slide"
        className="h-8 w-8 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        className="flex gap-1.5"
        role="tablist"
        aria-label="Carousel navigation"
      >
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === currentIndex}
            aria-current={index === currentIndex ? "true" : undefined}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => onIndicatorClick(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-[#D7FF3C]"
                : "w-2 bg-[#444] hover:bg-[#666]"
            }`}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        aria-label="Next slide"
        className="h-8 w-8 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
