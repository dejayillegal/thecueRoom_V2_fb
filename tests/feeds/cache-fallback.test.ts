
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readCache, writeCache, clearCache } from '../../packages/feeds/cache';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.local', 'cache', 'gigs');

describe('Feed Cache', () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    if (existsSync(CACHE_DIR)) {
      rmSync(CACHE_DIR, { recursive: true, force: true });
    }
  });

  it('should write and read cache successfully', () => {
    const events = [
      { id: '1', title: 'Test Event', date: '2025-01-01', venue: 'Test Venue', url: 'http://test.com', source: 'test' },
    ];

    writeCache('test-source', events, 600);
    const cached = readCache('test-source', 600);

    expect(cached).not.toBeNull();
    expect(cached?.events).toEqual(events);
  });

  it('should return null for expired cache', async () => {
    const events = [{ id: '1', title: 'Test', date: '2025-01-01', venue: 'Test', url: 'http://test.com', source: 'test' }];

    writeCache('test-source', events, 1); // 1 second TTL
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
    
    const cached = readCache('test-source', 1);
    expect(cached).toBeNull();
  });

  it('should return null for non-existent cache', () => {
    const cached = readCache('nonexistent-source', 600);
    expect(cached).toBeNull();
  });

  it('should clear specific source cache', () => {
    const events = [{ id: '1', title: 'Test', date: '2025-01-01', venue: 'Test', url: 'http://test.com', source: 'test' }];
    
    writeCache('source1', events, 600);
    writeCache('source2', events, 600);
    
    clearCache('source1');
    
    const cached1 = readCache('source1', 600);
    const cached2 = readCache('source2', 600);
    
    expect(cached1).toBeNull();
    expect(cached2).not.toBeNull();
  });
});
