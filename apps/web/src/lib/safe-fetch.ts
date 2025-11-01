/**
 * Safe fetch utilities with retry logic, exponential backoff, and structured error handling
 * Handles DNS failures (ENOTFOUND), timeouts, and non-JSON responses gracefully
 * 
 * THIS MODULE IS SERVER-ONLY when used in API routes.
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

export interface SafeFetchOptions {
  timeout?: number;
  attempts?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely fetches a URL with automatic retries and exponential backoff
 * Returns structured result instead of throwing on network/DNS failures
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<FetchResult> {
  const {
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || '15000', 10),
    attempts = parseInt(process.env.POLL_RETRY_ATTEMPTS || '3', 10),
    headers = {},
    signal
  } = options;

  let lastError: any = null;

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
          await sleep(backoff);
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
        await sleep(backoff);
      }
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' }
  };
}

export default safeFetch;