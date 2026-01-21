import pLimit from 'p-limit';
import { getDbClient } from '@thecueroom/db/client';
import { sources, feeds } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';

export interface PollerConfig {
  pollIntervalSeconds: number;
  pollConcurrency: number;
  failureThreshold: number;
  fetchTimeoutMs: number;
  maxContentSizeMB: number;
}

export interface FeedSource {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
  failureCount: number;
  lastFetch?: Date;
}

interface FetchResult {
  sourceId: string;
  success: boolean;
  itemCount?: number;
  error?: string;
  bytesRead?: number;
}

const DEFAULT_CONFIG: PollerConfig = {
  pollIntervalSeconds: parseInt(process.env.POLL_INTERVAL_SECONDS || '60', 10),
  pollConcurrency: parseInt(process.env.POLL_CONCURRENCY || '3', 10),
  failureThreshold: parseInt(process.env.FEED_FAILURE_THRESHOLD || '5', 10),
  fetchTimeoutMs: 20000,
  maxContentSizeMB: 5,
};

const LOG_DIR = join(process.cwd(), 'logs');

class FeedPoller {
  private config: PollerConfig;
  private limit: ReturnType<typeof pLimit>;
  private isRunning: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  private logStream: any = null;

  constructor(config: Partial<PollerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.limit = pLimit(this.config.pollConcurrency);
  }

  async initialize() {
    // Ensure log directory exists
    await mkdir(LOG_DIR, { recursive: true });
    this.logStream = createWriteStream(join(LOG_DIR, 'feed-poller.log'), { flags: 'a' });
    this.log('Poller initialized', this.config);
  }

  private log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
    console.log(logEntry.trim());
    if (this.logStream) {
      this.logStream.write(logEntry);
    }
  }

  private async fetchWithTimeout(
    url: string,
    timeoutMs: number,
    maxBytes: number
  ): Promise<{ text: string; bytesRead: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'thecueRoom/2.0 Feed Poller',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP \${response.status}: \${response.statusText}`);
      }

      // Stream with size limit
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const chunks: Uint8Array[] = [];
      let bytesRead = 0;
      const maxBytesAllowed = maxBytes * 1024 * 1024;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bytesRead += value.length;
        if (bytesRead > maxBytesAllowed) {
          reader.cancel();
          throw new Error(`Content exceeds \${maxBytes}MB limit`);
        }

        chunks.push(value);
      }

      const allChunks = new Uint8Array(bytesRead);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      const text = new TextDecoder().decode(allChunks);
      return { text, bytesRead };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout after \${timeoutMs}ms`);
      }
      throw error;
    }
  }

  private async fetchWithRetry(
    url: string,
    retries: number = 2
  ): Promise<{ text: string; bytesRead: number }> {
    const delays = [500, 1500]; // ms
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.fetchWithTimeout(
          url,
          this.config.fetchTimeoutMs,
          this.config.maxContentSizeMB
        );
      } catch (error: any) {
        lastError = error;
        if (i < retries) {
          const delay = delays[i] + Math.random() * 200; // Add jitter
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Fetch failed');
  }

  private calculateBackoff(failureCount: number): number {
    const baseDelay = 60000; // 1 minute
    const maxDelay = 3600000; // 1 hour
    const delay = Math.min(baseDelay * Math.pow(2, failureCount), maxDelay);
    return delay;
  }

  private async fetchSource(source: FeedSource): Promise<FetchResult> {
    // Check backoff
    if (source.failureCount > 0 && source.lastFetch) {
      const backoffDelay = this.calculateBackoff(source.failureCount);
      const timeSinceLast = Date.now() - source.lastFetch.getTime();
      if (timeSinceLast < backoffDelay) {
        return {
          sourceId: source.id,
          success: false,
          error: `Backed off (\${Math.round((backoffDelay - timeSinceLast) / 1000)}s remaining)`,
        };
      }
    }

    try {
      const { text, bytesRead } = await this.fetchWithRetry(source.url);

      // Simple item count (look for <item> or <entry> tags, or JSON array)
      let itemCount = 0;
      if (text.includes('<item>') || text.includes('<entry>')) {
        const matches = text.match(/<item>|<entry>/gi);
        itemCount = matches ? matches.length : 0;
      } else {
        try {
          const json = JSON.parse(text);
          itemCount = Array.isArray(json) ? json.length : (json.items?.length || 0);
        } catch {
          // Not JSON, that's okay
        }
      }

      // Update source: reset failure count
      const db = await getDbClient();
      await db.update(sources)
        .set({ failureCount: 0, lastFetch: new Date() })
        .where(eq(sources.id, source.id));

      this.log(`✓ \${source.name}: \${itemCount} items, \${bytesRead} bytes`);

      return {
        sourceId: source.id,
        success: true,
        itemCount,
        bytesRead,
      };
    } catch (error: any) {
      const newFailureCount = source.failureCount + 1;
      const shouldDisable = newFailureCount >= this.config.failureThreshold;

      // Update source: increment failure, maybe disable
      const db = await getDbClient();
      await db.update(sources)
        .set({
          failureCount: newFailureCount,
          lastFetch: new Date(),
          enabled: shouldDisable ? false : source.enabled,
        })
        .where(eq(sources.id, source.id));

      this.log(`✗ \${source.name}: \${error.message} (failures: \${newFailureCount}\${shouldDisable ? ', DISABLED' : ''})`);

      return {
        sourceId: source.id,
        success: false,
        error: error.message,
      };
    }
  }

  async runOnce(): Promise<void> {
    const db = await getDbClient();
    const enabledSources = await db.select().from(sources).where(eq(sources.enabled, true));

    if (enabledSources.length === 0) {
      this.log('No enabled sources to fetch');
      return;
    }

    this.log(`Fetching \${enabledSources.length} sources (concurrency: \${this.config.pollConcurrency})`);

    const results = await Promise.all(
      enabledSources.map(source =>
        this.limit(() => this.fetchSource(source as FeedSource))
      )
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalItems = results.reduce((sum, r) => sum + (r.itemCount || 0), 0);

    this.log(`Completed: \${successful} successful, \${failed} failed, \${totalItems} items`);
  }

  start() {
    if (this.isRunning) {
      this.log('Already running');
      return;
    }

    this.isRunning = true;
    this.log(`Started (interval: \${this.config.pollIntervalSeconds}s)`);

    // Initial run
    this.runOnce().catch(err => this.log('Error in runOnce:', err));

    // Set interval
    this.intervalHandle = setInterval(() => {
      this.runOnce().catch(err => this.log('Error in runOnce:', err));
    }, this.config.pollIntervalSeconds * 1000);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.isRunning = false;
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
    this.log('Stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}

export { FeedPoller };
