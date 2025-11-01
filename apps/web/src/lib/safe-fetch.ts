/**
 * Safe fetch utilities with retry logic, exponential backoff, and structured error handling
 * Handles DNS failures (ENOTFOUND), timeouts, and non-JSON responses gracefully
 */

export interface FetchResult {
  ok: boolean;
  status?: number;
  json?: any;
  text?: string;
  error?: {
    code?: string;
    message: string;
    retried?: number;
  };
}

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  attempts?: number;
}

/**
 * Safely fetches a URL with automatic retries and exponential backoff
 * Returns structured result instead of throwing on network/DNS failures
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<FetchResult> {
  const { timeout = 10000, attempts = 3, ...fetchOptions } = options;
  let lastError: any = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-OK HTTP status
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          return {
            ok: false,
            status: response.status,
            text: text.slice(0, 300),
            error: {
              message: `HTTP ${response.status}: ${response.statusText}`,
              code: `HTTP_${response.status}`,
            },
          };
        }

        // Try to parse as JSON
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const json = await response.json();
            return { ok: true, status: response.status, json };
          } catch (parseError) {
            const text = await response.text().catch(() => '');
            return { ok: true, status: response.status, text };
          }
        } else {
          const text = await response.text();
          return { ok: true, status: response.status, text };
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error: any) {
      lastError = error;

      // Capture DNS and network errors
      const errorCode = error.code || error.errno || error.name;
      const isDNSError = errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN';
      const isNetworkError = 
        errorCode === 'ECONNREFUSED' || 
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ECONNRESET';
      const isTimeout = error.name === 'AbortError';

      // Don't retry on certain permanent failures
      if (isDNSError && attempt < attempts - 1) {
        // Still retry DNS errors once in case it's transient
        const backoff = 300 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }

      // On last attempt or non-retryable error, return structured error
      if (attempt === attempts - 1 || (!isDNSError && !isNetworkError && !isTimeout)) {
        return {
          ok: false,
          error: {
            code: errorCode,
            message: isDNSError 
              ? `DNS resolution failed for ${new URL(url).hostname}`
              : isTimeout
              ? `Request timeout after ${timeout}ms`
              : isNetworkError
              ? `Network error: ${error.message}`
              : error.message || 'Unknown fetch error',
            retried: attempt,
          },
        };
      }

      // Exponential backoff before retry
      const backoff = 300 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  // Should never reach here, but handle edge case
  return {
    ok: false,
    error: {
      message: lastError?.message || 'All retry attempts failed',
      code: lastError?.code || 'UNKNOWN',
      retried: attempts - 1,
    },
  };
}
interface SafeFetchOptions {
  timeout?: number;
  attempts?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface SafeFetchError {
  code: string;
  message: string;
  retryAfter?: number;
  statusCode?: number;
}

interface SafeFetchResult {
  ok: boolean;
  status: number;
  text?: string;
  json?: any;
  error?: SafeFetchError;
}

export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const {
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || '15000', 10),
    attempts = parseInt(process.env.POLL_RETRY_ATTEMPTS || '3', 10),
    headers = {},
    signal
  } = options;

  let lastError: SafeFetchError | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'thecueRoom/2.0 Feed Aggregator',
          ...headers
        },
        signal: signal || controller.signal
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let json = null;

      try {
        json = JSON.parse(text);
      } catch {
        // Not JSON, that's fine
      }

      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after');
        lastError = {
          code: `HTTP_${response.status}`,
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          retryAfter: retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined
        };

        // Don't retry on 4xx errors (except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return { ok: false, status: response.status, text, json, error: lastError };
        }

        // Exponential backoff for retryable errors
        if (attempt < attempts - 1) {
          const backoff = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 10000);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }

      return { ok: true, status: response.status, text, json };

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        lastError = {
          code: 'TIMEOUT',
          message: `Request timeout after ${timeout}ms`
        };
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        lastError = {
          code: 'DNS_ERROR',
          message: `DNS lookup failed: ${error.message}`
        };
      } else if (error.code === 'ECONNREFUSED') {
        lastError = {
          code: 'CONNECTION_REFUSED',
          message: 'Connection refused'
        };
      } else {
        lastError = {
          code: error.code || 'FETCH_ERROR',
          message: error.message || 'Unknown fetch error'
        };
      }

      // Exponential backoff
      if (attempt < attempts - 1) {
        const backoff = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 10000);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' }
  };
}
