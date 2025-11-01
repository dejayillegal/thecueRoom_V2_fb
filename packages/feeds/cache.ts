import fs from 'fs';
import path from 'path';

const CACHE_DIR = process.env.FEEDS_CACHE_PATH || path.join(process.cwd(), '.local/feeds-cache');

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function readCache<T = any>(key: string, ttlSeconds?: number): { data: T; isStale: boolean } | null {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return null;
    }

    const filePath = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(content);

    const age = Date.now() - entry.timestamp;
    const effectiveTtl = (ttlSeconds || entry.ttl) * 1000;
    const isStale = age > effectiveTtl;

    return { data: entry.data, isStale };
  } catch (error) {
    console.error(`[Cache] Read error for ${key}:`, error);
    return null;
  }
}

export function writeCache<T = any>(key: string, data: T, ttlSeconds: number = 900): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds
    };

    const filePath = path.join(CACHE_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');
  } catch (error) {
    console.error(`[Cache] Write error for ${key}:`, error);
  }
}

export function clearCache(key?: string): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return;
    }

    if (key) {
      const filePath = path.join(CACHE_DIR, `${key}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    }
  } catch (error) {
    console.error('[Cache] Clear error:', error);
  }
}