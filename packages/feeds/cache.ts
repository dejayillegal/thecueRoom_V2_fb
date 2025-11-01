
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.local', 'cache', 'gigs');

interface CacheEntry {
  events: any[];
  lastFetched: number;
  ttl: number;
}

/**
 * Ensures cache directory exists
 */
function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Reads cached data for a source if still valid
 */
export function readCache(sourceName: string, ttlSeconds: number = 600): CacheEntry | null {
  try {
    ensureCacheDir();
    const cachePath = join(CACHE_DIR, `${sourceName}.json`);
    
    if (!existsSync(cachePath)) {
      return null;
    }

    const data = readFileSync(cachePath, 'utf-8');
    const cache: CacheEntry = JSON.parse(data);

    const age = Date.now() - cache.lastFetched;
    const maxAge = ttlSeconds * 1000;

    if (age > maxAge) {
      return null;
    }

    return cache;
  } catch (error) {
    console.error(`[Cache] Failed to read cache for ${sourceName}:`, error);
    return null;
  }
}

/**
 * Writes cache data atomically for a source
 */
export function writeCache(sourceName: string, events: any[], ttl: number = 600): void {
  try {
    ensureCacheDir();
    const cachePath = join(CACHE_DIR, `${sourceName}.json`);
    const tempPath = `${cachePath}.tmp`;

    const cacheEntry: CacheEntry = {
      events,
      lastFetched: Date.now(),
      ttl,
    };

    // Atomic write: write to temp file then rename
    writeFileSync(tempPath, JSON.stringify(cacheEntry, null, 2));
    renameSync(tempPath, cachePath);
  } catch (error) {
    console.error(`[Cache] Failed to write cache for ${sourceName}:`, error);
  }
}

/**
 * Clears cache for a specific source or all sources
 */
export function clearCache(sourceName?: string): void {
  try {
    ensureCacheDir();
    if (sourceName) {
      const cachePath = join(CACHE_DIR, `${sourceName}.json`);
      if (existsSync(cachePath)) {
        writeFileSync(cachePath, JSON.stringify({ events: [], lastFetched: 0, ttl: 0 }));
      }
    } else {
      // Clear all caches
      const fs = require('fs');
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          writeFileSync(join(CACHE_DIR, file), JSON.stringify({ events: [], lastFetched: 0, ttl: 0 }));
        }
      });
    }
  } catch (error) {
    console.error('[Cache] Failed to clear cache:', error);
  }
}
