
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

export async function pollJobStatus(jobId: string) {
  return safeFetch(`/api/epk/job/${jobId}`);
}
