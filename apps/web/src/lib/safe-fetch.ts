export interface SafeFetchOptions extends RequestInit {
  attempts?: number;
  timeout?: number;
  retryDelay?: number;
}

export async function safeFetch<T = any>(
  url: string,
  options: SafeFetchOptions = {},
): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  const {
    attempts = 3,
    timeout = 10000,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
        data: (await response.text()) as any,
        status: response.status,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        if (attempt < attempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * attempt),
          );
          continue;
        }
        return { ok: false, error: "Request timeout", status: 408 };
      }

      if (attempt < attempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
        continue;
      }

      return { ok: false, error: error.message || "Network error", status: 0 };
    }
  }

  return { ok: false, error: "Max retries exceeded", status: 0 };
}
