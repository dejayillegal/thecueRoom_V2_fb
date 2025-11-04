"use client";

import { useRef, useEffect, useState } from "react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { Card } from "@/components/ui/card";

interface SpotlightItem {
  id: string;
  title: string;
  image: string;
  url: string;
}

interface SpotlightColumnProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export default function SpotlightColumn({
  children,
  speed = 30,
  className = ""
}: SpotlightColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>();
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    // Clone content for seamless loop
    const clone = content.cloneNode(true) as HTMLElement;
    container.appendChild(clone);

    const scroll = () => {
      if (!isPaused && container && content) {
        scrollPositionRef.current += speed / 60; // 60fps

        // Reset when first set is fully scrolled
        if (scrollPositionRef.current >= content.scrollHeight) {
          scrollPositionRef.current = 0;
        }

        container.scrollTop = scrollPositionRef.current;
      }

      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Remove clone on cleanup
      if (container.children.length > 1) {
        container.removeChild(container.lastChild!);
      }
    };
  }, [isPaused, speed]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto scrollbar-hide ${className}`}
      style={{
        scrollBehavior: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
}