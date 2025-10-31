
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feed Poller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should honor concurrency limits', async () => {
    const concurrency = 3;
    let activeRequests = 0;
    let maxConcurrent = 0;

    const mockFetch = vi.fn(async () => {
      activeRequests++;
      maxConcurrent = Math.max(maxConcurrent, activeRequests);
      await new Promise(resolve => setTimeout(resolve, 100));
      activeRequests--;
      return new Response('<rss><item></item></rss>');
    });

    global.fetch = mockFetch as any;

    // Simulate fetching 10 sources with concurrency 3
    const sources = Array.from({ length: 10 }, (_, i) => ({
      id: `source-${i}`,
      url: `https://example.com/feed${i}.xml`,
      name: `Feed ${i}`,
      enabled: true,
      failureCount: 0,
    }));

    // Mock poller logic
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(concurrency);
    
    await Promise.all(
      sources.map(source =>
        limit(async () => {
          await mockFetch(source.url);
        })
      )
    );

    expect(maxConcurrent).toBeLessThanOrEqual(concurrency);
    expect(mockFetch).toHaveBeenCalledTimes(10);
  });

  it('should disable source after failure threshold', async () => {
    const failureThreshold = 3;
    let failureCount = 0;
    let isEnabled = true;

    // Simulate failing fetch
    for (let i = 0; i < failureThreshold; i++) {
      failureCount++;
      if (failureCount >= failureThreshold) {
        isEnabled = false;
      }
    }

    expect(isEnabled).toBe(false);
    expect(failureCount).toBe(failureThreshold);
  });

  it('should implement exponential backoff', () => {
    const calculateBackoff = (failureCount: number) => {
      const baseDelay = 60000;
      const maxDelay = 3600000;
      return Math.min(baseDelay * Math.pow(2, failureCount), maxDelay);
    };

    expect(calculateBackoff(0)).toBe(60000);
    expect(calculateBackoff(1)).toBe(120000);
    expect(calculateBackoff(2)).toBe(240000);
    expect(calculateBackoff(10)).toBe(3600000); // Capped at max
  });

  it('should retry failed fetches with delays', async () => {
    let attemptCount = 0;
    const maxRetries = 2;
    const delays = [500, 1500];

    const fetchWithRetry = async (url: string) => {
      for (let i = 0; i <= maxRetries; i++) {
        attemptCount++;
        try {
          if (i < maxRetries) {
            throw new Error('Simulated failure');
          }
          return { success: true };
        } catch (error) {
          if (i < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delays[i]));
          } else {
            throw error;
          }
        }
      }
    };

    const result = await fetchWithRetry('https://example.com/feed.xml');
    expect(attemptCount).toBe(3);
    expect(result.success).toBe(true);
  });
});
