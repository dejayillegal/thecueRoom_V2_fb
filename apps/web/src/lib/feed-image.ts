import { LRUCache } from 'lru-cache';

/**
 * Centralized feed image handling module
 * Returns optimized fallback thumbnails when article images are missing or invalid
 * Uses deterministic hash-based selection from 4 fallback images
 */

// LRU cache for HEAD request results (60s TTL, max 1000 entries)
const imageValidationCache = new LRUCache<string, boolean>({
  max: 1000,
  ttl: 60 * 1000, // 60 seconds
});

/**
 * Validates if a URL is a valid HTTP/HTTPS URL
 */
function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if an image URL is valid and accessible (cached)
 */
async function validateImageUrl(url: string): Promise<boolean> {
  // Check cache first
  const cached = imageValidationCache.get(url);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const isValid =
      response.ok &&
      (response.headers.get('content-type')?.startsWith('image/') ?? false);

    imageValidationCache.set(url, isValid);
    return isValid;
  } catch {
    imageValidationCache.set(url, false);
    return false;
  }
}

/**
 * Generate URL for fallback thumbnail API
 */
export function getFallbackUrl(id: string): string {
  return `/api/fallback-thumb/${encodeURIComponent(id)}`;
}

/**
 * Generate srcset for responsive fallback images
 * Note: Now serves same image at all sizes since we're using static PNGs
 */
export function getFallbackSrcSet(id: string): string {
  const url = getFallbackUrl(id);
  return `${url} 1x, ${url} 2x`;
}

/**
 * Get the article image URL with fallback support
 */
export async function getArticleImage(article: {
  image?: string | null;
  guid?: string;
  url?: string;
  title?: string;
} | null): Promise<string> {
  // If no image provided, return fallback immediately
  if (!article || !article.image || !isValidHttpUrl(article.image)) {
    const id = article?.guid || article?.url || article?.title || 'default';
    return getFallbackUrl(id);
  }

  // Validate the image URL (with caching)
  const isValid = await validateImageUrl(article.image);

  if (isValid) {
    return article.image;
  }

  // Return fallback if invalid
  const id = article.guid || article.url || article.title || 'default';
  return getFallbackUrl(id);
}

/**
 * Get article image synchronously (for client-side use)
 */
export function getArticleImageSync(article: {
  image?: string | null;
  guid?: string;
  url?: string;
  title?: string;
} | null): string {
  if (!article || !article.image || !isValidHttpUrl(article.image)) {
    const id = article?.guid || article?.url || article?.title || 'default';
    return getFallbackUrl(id);
  }

  return article.image;
}
