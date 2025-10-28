
'use client';

import { useRef, useEffect, useState } from 'react';
import { useEventListener } from '@/hooks/use-event-listener';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Card } from '@/components/ui/card';

interface SpotlightItem {
  id: string;
  title: string;
  image: string;
  url: string;
}

interface SpotlightColumnProps {
  items: SpotlightItem[];
}

/**
 * Auto-scrolling spotlight column using requestAnimationFrame
 * Respects prefers-reduced-motion and pauses on hover
 */
export function SpotlightColumn({ items }: SpotlightColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
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
    if (prefersReducedMotion || isPaused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let lastTime = 0;
    const speed = 0.5; // pixels per frame

    const scroll = (time: number) => {
      if (lastTime) {
        const delta = time - lastTime;
        const distance = (delta / 16) * speed;

        if (container.scrollTop >= container.scrollHeight / 2) {
          container.scrollTop = 0;
        } else {
          container.scrollTop += distance;
        }
      }
      lastTime = time;
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
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="h-[600px] overflow-hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="space-y-4">
        {[...items, ...items].map((item, index) => (
          <Card
            key={`${item.id}-${index}`}
            className="bg-[#111111] border-[#1a1a1a] overflow-hidden hover:border-[#333333] transition-colors"
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <div className="aspect-video relative">
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="300px"
                  quality={75}
                />
              </div>
              <div className="p-3">
                <h3 className="text-white text-sm line-clamp-2">{item.title}</h3>
              </div>
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
