/**
 * Centralized feed image handling module
 * Returns a constant fallback thumbnail when article images are missing or invalid
 * Eliminates title-as-image rendering for better performance
 */

const FALLBACK_THUMBNAIL = '/fallback-thumbnail.png';

/**
 * Validates if a URL is a valid HTTP/HTTPS URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Gets the image URL for a feed item
 * Returns fallback thumbnail if the image is missing or invalid
 * 
 * @param imageUrl - The image URL from the feed item (can be null/undefined)
 * @param _title - Article title (preserved for API compatibility but not used)
 * @returns Valid image URL or fallback thumbnail path
 */
export function getFeedImageUrl(imageUrl: string | null | undefined, _title?: string): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return FALLBACK_THUMBNAIL;
  }

  const trimmedUrl = imageUrl.trim();

  // If already using fallback, return as-is
  if (trimmedUrl === FALLBACK_THUMBNAIL) {
    return FALLBACK_THUMBNAIL;
  }

  // Check for data URIs (base64 encoded images)
  if (trimmedUrl.startsWith('data:image/')) {
    return trimmedUrl;
  }

  // Validate HTTP/HTTPS URLs
  if (!isValidImageUrl(trimmedUrl)) {
    return FALLBACK_THUMBNAIL;
  }

  return trimmedUrl;
}

/**
 * Gets the fallback thumbnail path
 * @returns Path to the fallback thumbnail
 */
export function getFallbackThumbnail(): string {
  return FALLBACK_THUMBNAIL;
}
