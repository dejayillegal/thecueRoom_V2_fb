
import fetch from 'cross-fetch';

export interface SafeFetchOptions {
  timeout?: number;
  attempts?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  method?: string;
  body?: any;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  json?: any;
  text?: string;
  error?: string;
}

/**
 * Safe fetch with timeout, retry, exponential backoff, and safe JSON parsing
 */
export async function safeFetch(
  url: string,
  opts: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const timeout = opts.timeout ?? 15000;
  const attempts = opts.attempts ?? 3;
  const headers = opts.headers ?? {};
  const parentSignal = opts.signal;

  let lastError: any = null;

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    // Combine parent signal with timeout controller
    if (parentSignal?.aborted) {
      clearTimeout(timer);
      return { ok: false, status: 0, error: 'Aborted by parent signal' };
    }

    try {
      const res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      // Try JSON parse if content-type suggests JSON
      if (contentType.includes('application/json')) {
        try {
          const json = JSON.parse(text);
          return { ok: res.ok, status: res.status, json };
        } catch (parseErr) {
          // JSON parse failed, return text
          return {
            ok: false,
            status: res.status,
            text: text.slice(0, 1024),
            error: 'Invalid JSON response',
          };
        }
      }

      // HTML or other response
      if (text.trim().startsWith('<')) {
        return {
          ok: false,
          status: res.status,
          text: text.slice(0, 1024),
          error: 'HTML response received when JSON expected',
        };
      }

      // Plain text or unknown
      return { ok: res.ok, status: res.status, text };
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      // Don't retry on abort
      if (err.name === 'AbortError') {
        return { ok: false, status: 0, error: 'Request timeout' };
      }

      // Exponential backoff before retry
      if (i < attempts - 1) {
        const backoff = 500 * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError?.message || 'Network error after retries',
  };
}

/**
 * Safe response handler - never throws on non-JSON
 */
export async function safeJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  
  if (!text || text.trim().startsWith('<')) {
    return {
      ok: false,
      status: response.status,
      error: 'HTML response',
      snippet: text.slice(0, 1024),
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: response.status,
      error: 'Invalid JSON',
      snippet: text.slice(0, 1024),
    };
  }
}
