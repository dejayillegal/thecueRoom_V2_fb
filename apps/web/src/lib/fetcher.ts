const DEFAULT_TIMEOUT = 10000;

export async function fetcher<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchParallel<T>(
  urls: string[],
  options?: RequestInit & { timeout?: number }
): Promise<(T | Error)[]> {
  return Promise.allSettled(
    urls.map(url => fetcher<T>(url, options))
  ).then(results =>
    results.map(result =>
      result.status === 'fulfilled' ? result.value : result.reason
    )
  );
}
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
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
  timeout?: number
): Promise<Array<T | null>> {
  const promises = urls.map(async (url) => {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      return await response.json();
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
      return null;
    }
  });

  return Promise.all(promises);
}
