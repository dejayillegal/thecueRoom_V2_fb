/**
 * Safe fetch utility with timeouts, retries, and backoff
 */

export interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  attempts?: number;
  backoffMs?: number;
}

export interface SafeFetchResult {
  ok: boolean;
  status?: number;
  data?: any;
  text?: string;
  error?: string;
}

export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || '15000'),
    attempts = 3,
    backoffMs = 1000
  } = options;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'thecueRoom/2.0',
          ...headers
        },
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: any;
      let text: string | undefined;

      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          text = await response.text();
          return {
            ok: false,
            status: response.status,
            text,
            error: 'Invalid JSON response'
          };
        }
      } else {
        text = await response.text();
      }

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          data,
          text
        };
      }

      return {
        ok: false,
        status: response.status,
        data,
        text,
        error: `HTTP ${response.status}`
      };

    } catch (error: any) {
      if (attempt === attempts) {
        return {
          ok: false,
          error: error.message || 'Fetch failed'
        };
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
    }
  }

  return {
    ok: false,
    error: 'Max attempts reached'
  };
}
