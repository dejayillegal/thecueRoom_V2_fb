
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeFetch } from '../../apps/web/src/lib/safe-fetch';

// Mock fetch
global.fetch = vi.fn();

describe('safeFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle successful JSON response', async () => {
    const mockData = { success: true, data: 'test' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const result = await safeFetch('https://example.com/api');
    
    expect(result.ok).toBe(true);
    expect(result.json).toEqual(mockData);
    expect(result.status).toBe(200);
  });

  it('should handle ENOTFOUND DNS error', async () => {
    const dnsError = new Error('getaddrinfo ENOTFOUND example.com');
    (dnsError as any).code = 'ENOTFOUND';
    (global.fetch as any).mockRejectedValueOnce(dnsError);

    const result = await safeFetch('https://example.com/api', { attempts: 2 });
    
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('ENOTFOUND');
    expect(result.error?.message).toContain('DNS resolution failed');
    expect(result.error?.retried).toBe(1);
  });

  it('should handle timeout with AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    (global.fetch as any).mockRejectedValueOnce(abortError);

    const result = await safeFetch('https://example.com/api', { timeout: 1000, attempts: 1 });
    
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('timeout');
  });

  it('should retry on network errors with backoff', async () => {
    const networkError = new Error('ECONNREFUSED');
    (networkError as any).code = 'ECONNREFUSED';
    
    (global.fetch as any)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

    const result = await safeFetch('https://example.com/api', { attempts: 3 });
    
    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle HTTP error status', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Page not found',
    });

    const result = await safeFetch('https://example.com/api');
    
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error?.code).toBe('HTTP_404');
  });

  it('should handle non-JSON response as text', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => '<html>Hello</html>',
    });

    const result = await safeFetch('https://example.com/api');
    
    expect(result.ok).toBe(true);
    expect(result.text).toBe('<html>Hello</html>');
  });
});
