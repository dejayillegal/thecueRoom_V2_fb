/**
 * Normalized event type for gigs aggregator
 */
export type NormalizedEvent = {
  id: string; // deterministic, e.g. source:id or hash
  title: string;
  description?: string;
  startAt?: string; // ISO
  endAt?: string;
  venue?: string;
  city?: string;
  country?: string;
  genres: string[]; // normalized to lowercase
  ticketUrl?: string;
  imageUrl?: string;
  source: string;
  raw?: any;
};

/**
 * Source adapter interface
 */
export interface SourceAdapter {
  name: string;
  fetchSource(): Promise<NormalizedEvent[]>;
}

/**
 * Fetch result with structured error handling
 */
export type SafeFetchResult = {
  ok: boolean;
  status?: number;
  body?: any;
  text?: string;
  error?: string;
};

/**
 * Fetch options
 */
export type SafeFetchOptions = {
  timeout?: number;
  attempts?: number;
  headers?: Record<string, string>;
  method?: string;
};

/**
 * Aggregator result
 */
export type AggregatorResult = {
  ok: boolean;
  summary: {
    total: number;
    bySource: Record<string, number>;
    errors: Record<string, string>;
    duration: number;
  };
  events: NormalizedEvent[];
};

/**
 * Gigs settings
 */
export type GigsSettings = {
  enabledSources?: string[];
  pollIntervalSeconds?: number;
  concurrency?: number;
  timeoutMs?: number;
  disabledSources?: string[];
};
