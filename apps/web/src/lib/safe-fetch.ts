/**
 * Safe fetch wrapper with timeout, retries, and error handling
 */

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  attempts?: number;
  retryDelay?: number;
}

export interface SafeFetchResponse<T = any> {
  ok: boolean;
  data?: T;
  text?: string;
  error?: string;
  status?: number;
}

export async function safeFetch<T = any>(
  url: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResponse<T>> {
  const {
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || "15000", 10),
    attempts = parseInt(process.env.POLL_RETRY_ATTEMPTS || "3", 10),
    retryDelay = 250,
    ...fetchOptions
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt < Math.max(1, attempts); attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: options.signal ?? controller.signal,
      });

      clearTimeout(timer);

      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          return {
            ok: false,
            error: errorData.error || errorData.message || "Request failed",
            status: response.status,
          };
        }
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      if (isJson) {
        const data = await response.json();
        return { ok: true, data, status: response.status };
      }

      return {
        ok: true,
        text: await response.text(),
        status: response.status,
      };
    } catch (error: any) {
      lastError = error;

      if (error.name === "AbortError") {
        if (attempt < attempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1)),
          );
          continue;
        }
        return { ok: false, error: "Request timeout", status: 408 };
      }

      if (attempt < attempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (attempt + 1)),
        );
        continue;
      }
    }
  }

  return {
    ok: false,
    error: lastError?.message || "Max retries exceeded",
    status: 0,
  };
}
