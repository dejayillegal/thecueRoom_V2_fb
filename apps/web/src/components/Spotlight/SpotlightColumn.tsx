'use client';

import React, { useRef, useEffect, useState, memo } from 'react';
import { useEventListener } from '@/hooks/use-event-listener';

interface SpotlightColumnProps {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightColumn = memo(function SpotlightColumn({
  children,
  className = '',
}: SpotlightColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const container = containerRef.current;
    if (!container) return;

    let scrollPosition = 0;
    const maxScroll = container.scrollHeight - container.clientHeight;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }
      container.scrollTop = scrollPosition;
      rafRef.current = requestAnimationFrame(scroll);
    };

    rafRef.current = requestAnimationFrame(scroll);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPaused, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto scrollbar-hide ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      style={{ scrollBehavior: 'auto' }}
    >
      {children}
    </div>
  );
});