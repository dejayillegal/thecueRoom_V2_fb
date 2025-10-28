
'use client';

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Pause, Play } from 'lucide-react';

interface SpotlightColumnProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

const SpotlightColumnComponent: React.FC<SpotlightColumnProps> = ({
  children,
  speed = 20,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!containerRef.current || isPaused || prefersReducedMotion) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    if (maxScroll > 0) {
      scrollPosRef.current += (speed * delta) / 1000;

      if (scrollPosRef.current >= maxScroll) {
        scrollPosRef.current = 0;
      }

      container.scrollTop = scrollPosRef.current;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [isPaused, prefersReducedMotion, speed]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ height: '100%' }}
        role="region"
        aria-label="Auto-scrolling spotlight content"
      >
        {children}
      </div>
      {!prefersReducedMotion && (
        <button
          onClick={togglePause}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
          type="button"
        >
          {isPaused ? (
            <Play className="w-4 h-4 text-white" />
          ) : (
            <Pause className="w-4 h-4 text-white" />
          )}
        </button>
      )}
    </div>
  );
};

export const SpotlightColumn = memo(SpotlightColumnComponent);
'use client';

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Pause, Play } from 'lucide-react';

interface SpotlightColumnProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

const SpotlightColumnComponent: React.FC<SpotlightColumnProps> = ({
  children,
  speed = 20,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!containerRef.current || isPaused || prefersReducedMotion) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    if (maxScroll > 0) {
      scrollPosRef.current += (speed * delta) / 1000;

      if (scrollPosRef.current >= maxScroll) {
        scrollPosRef.current = 0;
      }

      container.scrollTop = scrollPosRef.current;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [isPaused, prefersReducedMotion, speed]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ height: '100%' }}
        role="region"
        aria-label="Auto-scrolling spotlight content"
      >
        {children}
      </div>
      {!prefersReducedMotion && (
        <button
          onClick={togglePause}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
          type="button"
        >
          {isPaused ? (
            <Play className="w-4 h-4 text-white" />
          ) : (
            <Pause className="w-4 h-4 text-white" />
          )}
        </button>
      )}
    </div>
  );
};

export const SpotlightColumn = memo(SpotlightColumnComponent);
