/**
 * Safe fetch utilities to prevent JSON parsing errors on HTML responses
 * Provides structured error handling for all HTTP requests
 */

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
}

export interface SafeJsonResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
  snippet?: string;
}

/**
 * Safely fetches a resource with timeout support and proper error handling
 * 
 * @param url - URL to fetch
 * @param options - Fetch options with optional timeout in milliseconds
 * @returns Response object or throws with structured error
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

/**
 * Safely parses a Response as JSON, detecting HTML responses and returning structured errors
 * 
 * @param response - Response object from fetch
 * @returns SafeJsonResult with ok status, data, or error information
 */
export async function safeJsonResponse<T = any>(
  response: Response
): Promise<SafeJsonResult<T>> {
  const contentType = response.headers.get('content-type') || '';
  
  // Check if response is HTML instead of JSON
  if (contentType.includes('text/html')) {
    const text = await response.text();
    const snippet = text.slice(0, 200).replace(/<[^>]+>/g, '');
    
    return {
      ok: false,
      status: response.status,
      error: 'Server returned HTML instead of JSON',
      snippet,
    };
  }

  // Handle non-OK HTTP status
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const text = await response.text();
      
      // Try to parse as JSON first
      try {
        const errorData = JSON.parse(text);
        return {
          ok: false,
          status: response.status,
          error: errorData.error || errorData.message || errorMessage,
          data: errorData,
        };
      } catch {
        // Not JSON, return text snippet
        const snippet = text.slice(0, 200);
        return {
          ok: false,
          status: response.status,
          error: errorMessage,
          snippet,
        };
      }
    } catch {
      return {
        ok: false,
        status: response.status,
        error: errorMessage,
      };
    }
  }

  // Parse successful JSON response
  try {
    const data = await response.json();
    return {
      ok: true,
      data,
      status: response.status,
    };
  } catch (error) {
    const text = await response.text();
    const snippet = text.slice(0, 200);
    
    return {
      ok: false,
      status: response.status,
      error: 'Failed to parse JSON response',
      snippet,
    };
  }
}

/**
 * Combined safe fetch and JSON parse in one call
 * 
 * @param url - URL to fetch
 * @param options - Fetch options with optional timeout
 * @returns SafeJsonResult with parsed data or error
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeJsonResult<T>> {
  try {
    const response = await safeFetch(url, options);
    return await safeJsonResponse<T>(response);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown fetch error',
    };
  }
}

/**
 * Type guard to check if SafeJsonResult is successful
 */
export function isOk<T>(result: SafeJsonResult<T>): result is SafeJsonResult<T> & { data: T } {
  return result.ok === true && result.data !== undefined;
}
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
            return { ok: true, status: response.status, type: 'text', text };
          }
        } else {
          const text = await response.text();
          return { ok: true, status: response.status, type: 'text', text };
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
