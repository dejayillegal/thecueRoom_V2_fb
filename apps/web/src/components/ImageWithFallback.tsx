
'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/fallback-thumbnail.png',
  width,
  height,
  fill = false,
  className = '',
  sizes,
  priority = false,
  quality = 75,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  }, [imgSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const commonProps = {
    alt,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onError: handleError,
    onLoad: handleLoad,
    loading: priority ? undefined : ('lazy' as const),
    quality,
    sizes,
  };

  if (fill) {
    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
        )}
        <Image
          {...commonProps}
          src={imgSrc}
          fill
          style={{ objectFit: 'cover' }}
          priority={priority}
        />
      </>
    );
  }

  return (
    <>
      {isLoading && width && height && (
        <div
          className="bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse"
          style={{ width, height }}
        />
      )}
      <Image
        {...commonProps}
        src={imgSrc}
        width={width || 400}
        height={height || 400}
        priority={priority}
      />
    </>
  );
}
'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/fallback-thumbnail.png',
  width,
  height,
  fill = false,
  className = '',
  sizes,
  priority = false,
  quality = 75,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  }, [imgSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const commonProps = {
    alt,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onError: handleError,
    onLoad: handleLoad,
    loading: priority ? undefined : ('lazy' as const),
    quality,
    sizes,
  };

  if (fill) {
    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
        )}
        <Image
          {...commonProps}
          src={imgSrc}
          fill
          style={{ objectFit: 'cover' }}
          priority={priority}
        />
      </>
    );
  }

  return (
    <>
      {isLoading && width && height && (
        <div
          className="bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse"
          style={{ width, height }}
        />
      )}
      <Image
        {...commonProps}
        src={imgSrc}
        width={width || 400}
        height={height || 400}
        priority={priority}
      />
    </>
  );
}
