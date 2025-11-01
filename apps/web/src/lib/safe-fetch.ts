/**
 * Canonical safeFetch helper with proper AbortController usage
 * Single source of truth for all fetch operations
 */

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  attempts?: number;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  text?: string;
  json?: any;
  error?: {
    code: string;
    message: string;
  };
}

export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const {
    timeout = 10000,
    attempts = 1,
    ...fetchOptions
  } = options;

  let lastError: any = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    // Create a NEW AbortController for each attempt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Read response text
      const text = await response.text();
      
      // Try to parse as JSON
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        // Not JSON, that's okay
      }

      return {
        ok: response.ok,
        status: response.status,
        text,
        json,
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry on abort
      if (error.name === 'AbortError') {
        return {
          ok: false,
          status: 0,
          error: {
            code: 'TIMEOUT',
            message: `Request timeout after ${timeout}ms`,
          },
        };
      }

      // Retry on network errors
      if (attempt < attempts) {
        // Exponential backoff with jitter
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        const jitter = Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, backoff + jitter));
        continue;
      }
    }
  }

  // All attempts failed
  return {
    ok: false,
    status: 0,
    error: {
      code: lastError?.code || 'FETCH_FAILED',
      message: lastError?.message || 'All fetch attempts failed',
    },
  };
}
