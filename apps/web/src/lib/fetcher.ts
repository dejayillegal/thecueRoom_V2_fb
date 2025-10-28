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