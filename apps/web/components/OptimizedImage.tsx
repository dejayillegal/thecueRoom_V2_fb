
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  quality?: number;
  priority?: boolean;
  onError?: () => void;
  onLoad?: () => void;
  fallbackUrl?: string;
}

export function OptimizedImage({
  src,
  alt,
  fill = false,
  className = '',
  sizes,
  loading = 'lazy',
  quality = 75,
  priority = false,
  onError,
  onLoad,
  fallbackUrl,
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const maxRetries = 2;

  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = useCallback(() => {
    if (retryCount < maxRetries && !currentSrc.startsWith('/api/og-fallback')) {
      // Retry with cache-busting parameter
      setTimeout(() => {
        const separator = currentSrc.includes('?') ? '&' : '?';
        setCurrentSrc(`${currentSrc}${separator}_retry=${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
      }, 500 * (retryCount + 1)); // Exponential backoff
    } else {
      // Use fallback after retries exhausted
      setHasError(true);
      const fallback = fallbackUrl || `/api/og-fallback?title=${encodeURIComponent(alt.slice(0, 120))}`;
      setCurrentSrc(fallback);
      setIsLoading(false);
      onError?.();
    }
  }, [retryCount, currentSrc, alt, fallbackUrl, onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const shouldUnoptimize = currentSrc.startsWith('/api/og-fallback') || 
                          currentSrc.startsWith('data:') ||
                          hasError;

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        sizes={sizes}
        loading={loading}
        quality={quality}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={shouldUnoptimize}
      />
    </>
  );
}
