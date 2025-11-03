import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeFetch } from '../../apps/web/src/lib/safe-fetch';

describe('safeFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should successfully fetch and parse JSON', async () => {
    const mockData = { message: 'Success' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => mockData,
    } as any);

    const result = await safeFetch('/api/test');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
  });

  it('should handle non-JSON responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'text/plain']]),
      text: async () => 'Plain text response',
    } as any);

    const result = await safeFetch('/api/test');

    expect(result.ok).toBe(true);
    expect(result.data).toBe('Plain text response');
  });

  it('should handle HTTP errors with JSON error messages', async () => {
    const errorMessage = { error: 'Not found' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => errorMessage,
    } as any);

    const result = await safeFetch('/api/test');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.status).toBe(404);
  });

  it('should handle network errors with retry', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const promise = safeFetch('/api/test', { attempts: 2, retryDelay: 100 });
    
    // Fast-forward through retries
    await vi.advanceTimersByTimeAsync(300);
    const result = await promise;

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle timeout and retry', async () => {
    global.fetch = vi.fn().mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const promise = safeFetch('/api/test', { 
      timeout: 1000, 
      attempts: 1 
    });
    
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Request timeout');
    expect(result.status).toBe(408);
  });

  it('should use exponential backoff for retries', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Temporary error'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });
    });

    const promise = safeFetch('/api/test', { attempts: 3, retryDelay: 100 });
    
    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0);
    // Wait for first retry delay (100ms)
    await vi.advanceTimersByTimeAsync(100);
    // Wait for second retry delay (200ms due to exponential backoff)
    await vi.advanceTimersByTimeAsync(200);
    
    const result = await promise;

    expect(result.ok).toBe(true);
    expect(callCount).toBe(3);
  });
});
