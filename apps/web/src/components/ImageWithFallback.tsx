
'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export const ImageWithFallback = memo(function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/fallback-thumbnail.png',
  width = 400,
  height = 400,
  className = '',
  priority = false,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#1a1a1a] animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setImgSrc(fallbackSrc)}
        onLoad={() => setIsLoading(false)}
        className={className}
      />
    </div>
  );
});
