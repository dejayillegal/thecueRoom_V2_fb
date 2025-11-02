import { SafeFetchResult, SafeFetchOptions } from './types';

/**
 * Safe fetch with retries, timeout, and structured error handling
 * Never throws - always returns a structured result
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const {
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || '15000'),
    attempts = 3,
    headers = {},
    method = 'GET',
  } = options;

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'thecueRoom/2.0 (+https://thecueroom.com)',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();

      // Try to parse as JSON
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        // Not JSON, that's okay
        body = null;
      }

      if (!response.ok) {
        // Return error response but with ok: false
        return {
          ok: false,
          status: response.status,
          text,
          body,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        ok: true,
        status: response.status,
        text,
        body,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      lastError = error.name === 'AbortError' 
        ? `Timeout after ${timeout}ms`
        : error.message || String(error);

      // Exponential backoff
      if (attempt < attempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    ok: false,
    error: `Failed after ${attempts} attempts: ${lastError}`,
  };
}

/**
 * Parse HTML safely without heavy dependencies
 */
export function parseHTML(html: string) {
  // This is a placeholder - in production you'd use node-html-parser
  const parser = require('node-html-parser');
  return parser.parse(html);
}
