import { nanoid } from "nanoid";

export async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return response;
  } catch (error) {
    console.error("[safeFetch] Error:", error);
    throw error;
  }
}

export async function safeParseJSON<T = any>(response: Response): Promise<T> {
  try {
    const text = await response.text();
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (error) {
    console.error("[safeParseJSON] Error:", error);
    throw new Error("Invalid JSON response");
  }
}

export function validateSoundCloudUrl(url: string): boolean {
  const pattern = /^https?:\/\/(www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/i;
  return pattern.test(url);
}

export function extractSoundCloudTrackId(url: string): string | null {
  const match = url.match(/soundcloud\.com\/([\w-]+)\/([\w-]+)/i);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  return null;
}

export function getSoundCloudEmbedMarkup(trackId: string): string {
  return `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${encodeURIComponent(trackId)}&color=%239B5CFF&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe>`;
}

export function validateLink(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
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

export function debouncedLocalSave(
  key: string,
  data: any,
  delay: number = 500,
) {
  const save = debounce(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("[debouncedLocalSave] Error:", error);
    }
  }, delay);

  save();
}

export async function enqueueEPKJob(jobData: any): Promise<string> {
  const response = await safeFetch("/api/epk/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });

  const result = await safeParseJSON<{ ok: boolean; jobId: string }>(response);

  if (!result.ok) {
    throw new Error("Failed to enqueue job");
  }

  return result.jobId;
}

export async function pollJobStatus(
  jobId: string,
  onProgress?: (progress: number) => void,
): Promise<any> {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await safeFetch(`/api/epk/job/${jobId}`);
    const result = await safeParseJSON<{ ok: boolean; job: any }>(response);

    if (!result.ok) {
      throw new Error("Failed to get job status");
    }

    if (onProgress) {
      onProgress(result.job.progress || 0);
    }

    if (result.job.status === "done") {
      return result.job;
    }

    if (result.job.status === "error") {
      throw new Error(result.job.error || "Job failed");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error("Job timeout");
}

export function createModuleId(): string {
  return nanoid();
}

export type EPKModuleType =
  | "bio"
  | "tracklist"
  | "gallery"
  | "techRider"
  | "links"
  | "quotes";

export interface EPKModule {
  id: string;
  type: EPKModuleType;
  order: number;
  data: any;
}

export function createModule(type: EPKModuleType, order: number): EPKModule {
  const defaultData: Record<EPKModuleType, any> = {
    bio: { text: "" },
    tracklist: { tracks: [] },
    gallery: { images: [] },
    techRider: { items: [] },
    links: { links: [] },
    quotes: { quotes: [] },
  };

  return {
    id: createModuleId(),
    type,
    order,
    data: defaultData[type],
  };
}
