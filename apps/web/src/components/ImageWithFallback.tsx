
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  fallbackSrc?: string;
}

/**
 * Optimized Image component with automatic fallback handling
 * Implements lazy loading, CLS prevention, and error handling
 */
export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes,
  quality = 75,
  priority = false,
  fallbackSrc = '/fallback-thumbnail.png',
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        quality={quality}
        priority={priority}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 400}
      height={height || 300}
      className={className}
      sizes={sizes}
      quality={quality}
      priority={priority}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}
