export function createModuleId(): string {
  return `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export async function safeFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response;
}

export async function safeParseJSON<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON response');
  }
}

export type EPKModule = {
  id: string;
  type: string;
  order: number;
  data: any;
};

export type EPKModuleType = 'bio' | 'quotes' | 'tracklist' | 'techRider' | 'links' | 'gallery' | 'video';

export async function enqueueEPKJob(payload: any) {
  return safeFetch('/api/epk/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function pollJobStatus(
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<{ status: string; resultUrl?: string; error?: string }> {
  const maxAttempts = 60; // Increased timeout
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await safeFetch(`/api/epk/job/${jobId}`);
      const data = await safeParseJSON<{
        ok: boolean;
        job: {
          status: string;
          progress?: number;
          resultUrl?: string;
          error?: string;
        };
      }>(response);

      if (!data.ok) {
        throw new Error('Failed to fetch job status');
      }

      const { status, progress = 0, resultUrl, error } = data.job;

      // Report progress (0-100)
      if (onProgress) {
        const calculatedProgress = status === 'processing'
          ? Math.max(progress || 50, (attempts / maxAttempts) * 90)
          : status === 'queued'
          ? 10
          : status === 'done'
          ? 100
          : progress || 0;

        onProgress(Math.min(calculatedProgress, 100));
      }

      console.log(`[EPK Poll] Attempt ${attempts + 1}/${maxAttempts} - Status: ${status}, Progress: ${progress}%`);

      if (status === 'done' && resultUrl) {
        return { status, resultUrl };
      }

      if (status === 'error') {
        throw new Error(error || 'Job failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      console.error('[EPK Poll] Error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to poll job status'
      );
    }
  }

  throw new Error('Export timeout - please try again');
}