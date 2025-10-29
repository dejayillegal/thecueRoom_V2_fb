
/**
 * Simple stable hash function for deterministic fallback selection
 * Uses FNV-1a hash algorithm for consistent results
 */
export function hashToIndex(id: string, buckets = 4): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % buckets);
}

/**
 * Get fallback image number (1-4) for a given article ID
 */
export function getFallbackNumber(id: string): number {
  return hashToIndex(id, 4) + 1;
}
