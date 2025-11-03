"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { getFallbackUrl, getFallbackSrcSet } from "../lib/feed-image";

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
  articleId?: string; // For deterministic fallback selection
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
  className = "",
  sizes,
  quality = 75,
  priority = false,
  fallbackSrc,
  articleId,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" },
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);

      // Use deterministic fallback if articleId provided
      if (articleId) {
        setImgSrc(getFallbackUrl(articleId));
      } else if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      } else {
        // Default to first fallback if no articleId
        setImgSrc(getFallbackUrl("default"));
      }
    }
  };

  // Build srcSet for responsive images if using fallback
  const srcSet =
    hasError && articleId ? getFallbackSrcSet(articleId) : undefined;

  if (fill) {
    return (
      <div ref={imgRef} className="relative w-full h-full">
        {isInView && (
          <Image
            src={imgSrc}
            alt={alt}
            fill
            className={className}
            sizes={sizes}
            quality={quality}
            priority={priority}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            unoptimized={hasError}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={imgRef}>
      {isInView && (
        <Image
          src={imgSrc}
          alt={alt}
          width={width || 400}
          height={height || 300}
          className={className}
          sizes={sizes}
          srcSet={srcSet}
          quality={quality}
          priority={priority}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          unoptimized={hasError}
        />
      )}
    </div>
  );
}
