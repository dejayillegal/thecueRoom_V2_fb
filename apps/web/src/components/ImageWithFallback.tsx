
'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  className?: string;
  priority?: boolean;
}

export const ImageWithFallback = memo(function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/fallback-thumbnail.png',
  width,
  height,
  fill = false,
  sizes,
  quality = 75,
  className = '',
  priority = false,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const imageProps = fill
    ? {
        fill: true,
        sizes: sizes || '100vw',
        quality,
      }
    : {
        width: width || 400,
        height: height || 400,
        quality,
      };

  return (
    <div className={`relative ${fill ? '' : `w-[${width || 400}px] h-[${height || 400}px]`} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#1a1a1a] animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        {...imageProps}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setImgSrc(fallbackSrc)}
        onLoad={() => setIsLoading(false)}
        className={fill ? 'object-cover' : className}
      />
    </div>
  );
});
