import { useEffect, useRef, useCallback } from 'react';

interface FastTouchOptions {
  onTap?: (event: TouchEvent | MouseEvent) => void;
  onPress?: (event: TouchEvent | MouseEvent) => void;
  pressDelay?: number;
}

/**
 * Hook for fast tap handling with passive listeners to prevent 300ms delay
 * Uses touch events with fallback to mouse events
 * @param options - Configuration options
 * @returns ref to attach to element
 */
export function useFastTouch<T extends HTMLElement = HTMLElement>(
  options: FastTouchOptions
) {
  const { onTap, onPress, pressDelay = 500 } = options;
  const ref = useRef<T>(null);
  const touchStartTime = useRef<number>(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartTime.current = Date.now();
    hasMoved.current = false;
    
    if (onPress) {
      pressTimer.current = setTimeout(() => {
        if (!hasMoved.current) {
          onPress(e);
        }
      }, pressDelay);
    }
  }, [onPress, pressDelay]);

  const handleTouchMove = useCallback(() => {
    hasMoved.current = true;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    const touchDuration = Date.now() - touchStartTime.current;
    
    if (!hasMoved.current && touchDuration < pressDelay && onTap) {
      e.preventDefault();
      onTap(e);
    }
  }, [onTap, pressDelay]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    touchStartTime.current = Date.now();
    hasMoved.current = false;
    
    if (onPress) {
      pressTimer.current = setTimeout(() => {
        if (!hasMoved.current) {
          onPress(e);
        }
      }, pressDelay);
    }
  }, [onPress, pressDelay]);

  const handleMouseMove = useCallback(() => {
    hasMoved.current = true;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    const clickDuration = Date.now() - touchStartTime.current;
    
    if (!hasMoved.current && clickDuration < pressDelay && onTap) {
      onTap(e);
    }
  }, [onTap, pressDelay]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp]);

  return ref;
}
