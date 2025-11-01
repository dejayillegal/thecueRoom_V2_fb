
/**
 * Canonical safe fetch utility with retry logic, exponential backoff, and structured error handling
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR safeFetch
 */

export interface FetchResult {
  ok: boolean;
  status?: number;
  json?: any;
  text?: string;
  headers?: Record<string, string>;
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
  proxy?: string;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely fetches a URL with automatic retries and exponential backoff
 * Creates NEW AbortController for each attempt to avoid "Controller is already closed"
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<FetchResult> {
  const {
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || '15000', 10),
    attempts = parseInt(process.env.POLL_RETRY_ATTEMPTS || '3', 10),
    headers = {},
    signal,
    proxy
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    // Create NEW controller per attempt to avoid "Controller is already closed"
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Setup timeout
      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      const fetchOptions: RequestInit = {
        headers: {
          'User-Agent': process.env.FEED_USER_AGENT || 'thecueRoom/2.0 Feed Aggregator',
          ...headers
        },
        signal: signal || controller.signal
      };

      const response = await fetch(url, fetchOptions);

      // Clear timeout immediately on success
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

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

        // Don't retry on 4xx errors (except 429 Too Many Requests)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return { ok: false, status: response.status, text, json, headers: responseHeaders, error: lastError };
        }

        // Exponential backoff for retryable errors
        if (attempt < attempts - 1) {
          const backoff = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 10000);
          await sleep(backoff);
          continue;
        }
      }

      return { ok: true, status: response.status, text, json, headers: responseHeaders };

    } catch (error: any) {
      // Always clear timeout in catch
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

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
    } finally {
      // Ensure timeout is always cleared
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  return {
    ok: false,
    status: 0,
    error: {
      ...lastError,
      retried: attempts
    }
  };
}

export default safeFetch;
