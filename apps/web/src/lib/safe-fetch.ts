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
