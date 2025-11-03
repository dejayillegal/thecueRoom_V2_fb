const DEFAULT_TIMEOUT = 10000;

/**
 * Safely parse JSON with error handling - returns { ok, data } or { ok: false, text }
 * @param text - JSON string to parse
 * @returns Success with parsed data or failure with raw text
 */
export function safeParseJSON<T = any>(
  text: string,
): { ok: true; data: T } | { ok: false; text: string; error: string } {
  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid JSON";
    console.error(
      "[safeParseJSON] Parse error:",
      errorMessage,
      "Raw text:",
      text.substring(0, 200),
    );
    return { ok: false, text, error: errorMessage };
  }
}

export async function fetcher<T>(
  url: string,
  options: RequestInit & { timeout?: number; retries?: number } = {},
): Promise<T> {
  const { timeout = 5000, retries = 2, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    // Create fresh AbortController for each retry attempt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const result = safeParseJSON<T>(text);

      if (!result.ok) {
        // Return structured error instead of throwing
        throw new Error(
          `JSON Parse Error: ${result.error}. Response was: ${result.text.substring(0, 100)}`,
        );
      }

      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Fetch failed");
}

export async function fetchParallel<T>(
  urls: string[],
  options?: RequestInit & { timeout?: number },
): Promise<(T | Error)[]> {
  return Promise.allSettled(urls.map((url) => fetcher<T>(url, options))).then(
    (results) =>
      results.map((result) =>
        result.status === "fulfilled" ? result.value : result.reason,
      ),
  );
}
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function parallelFetch<T>(
  urls: string[],
  options?: RequestInit,
  timeout?: number,
): Promise<Array<T | null>> {
  const promises = urls.map(async (url) => {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      const text = await response.text();
      const result = safeParseJSON<T>(text);

      if (!result.ok) {
        console.error(`JSON Parse Error for ${url}:`, result.error);
        return null;
      }

      return result.data;
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
      return null;
    }
  });

  return Promise.all(promises);
}
