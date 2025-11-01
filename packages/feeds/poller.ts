
/**
 * Robust feed poller with concurrency control, exponential backoff, and failure tracking
 * Features:
 * - p-limit concurrency control
 * - AbortController with timeout
 * - Exponential backoff with jitter
 * - Automatic source disabling after failure threshold
 * - Streaming response handling with size limits
 * - Worker-friendly architecture
 */

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
          throw new Error(`Content exceeds ${maxBytes}MB limit`);
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
        throw new Error(`Timeout after ${timeoutMs}ms`);
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
          error: `Backed off (${Math.round((backoffDelay - timeSinceLast) / 1000)}s remaining)`,
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

      this.log(`✓ ${source.name}: ${itemCount} items, ${bytesRead} bytes`);

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

      this.log(`✗ ${source.name}: ${error.message} (failures: ${newFailureCount}${shouldDisable ? ', DISABLED' : ''})`);

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

    this.log(`Fetching ${enabledSources.length} sources (concurrency: ${this.config.pollConcurrency})`);

    const results = await Promise.all(
      enabledSources.map(source =>
        this.limit(() => this.fetchSource(source as FeedSource))
      )
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalItems = results.reduce((sum, r) => sum + (r.itemCount || 0), 0);

    this.log(`Completed: ${successful} successful, ${failed} failed, ${totalItems} items`);
  }

  start() {
    if (this.isRunning) {
      this.log('Already running');
      return;
    }

    this.isRunning = true;
    this.log(`Started (interval: ${this.config.pollIntervalSeconds}s)`);

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

// CLI entry point
if (require.main === module) {
  const poller = new FeedPoller();
  
  poller.initialize().then(() => {
    poller.start();

    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      poller.stop();
      process.exit(0);
    });
  });
}

export { FeedPoller };
import pLimit from 'p-limit';
import { Parser } from 'fast-xml-parser';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const FEEDS_DIR = './.local/feeds';
const SOURCES_FILE = join(FEEDS_DIR, 'feed_sources.json');
const METADATA_FILE = join(FEEDS_DIR, 'feed_metadata.json');

interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'atom' | 'html';
  enabled: boolean;
  failureCount: number;
  lastFetch?: Date;
  lastSuccess?: Date;
}

interface FeedItem {
  id: string;
  title: string;
  date: Date;
  venue?: string;
  location?: string;
  link?: string;
  description?: string;
  source: string;
}

let pollerRunning = false;
let pollerInterval: NodeJS.Timeout | null = null;

const safeFetch = async (url: string, timeout = 20000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const ensureFeedsDir = () => {
  if (!existsSync(FEEDS_DIR)) {
    mkdirSync(FEEDS_DIR, { recursive: true });
  }
};

const loadSources = (): FeedSource[] => {
  ensureFeedsDir();
  if (!existsSync(SOURCES_FILE)) {
    const defaultSources: FeedSource[] = [
      {
        id: 'rollingstone-india',
        name: 'Rolling Stone India - Events',
        url: process.env.ROLLINGSTONE_FEED || 'https://rollingstoneindia.com/?feed=gigpress',
        type: 'rss',
        enabled: true,
        failureCount: 0
      }
    ];
    writeFileSync(SOURCES_FILE, JSON.stringify(defaultSources, null, 2));
    return defaultSources;
  }
  return JSON.parse(readFileSync(SOURCES_FILE, 'utf-8'));
};

const saveSources = (sources: FeedSource[]) => {
  ensureFeedsDir();
  writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2));
};

const saveMetadata = (metadata: any) => {
  ensureFeedsDir();
  writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
};

const parseFeed = async (source: FeedSource): Promise<FeedItem[]> => {
  const response = await safeFetch(source.url);
  const text = await response.text();
  
  const parser = new Parser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  
  const result = parser.parse(text);
  const items: FeedItem[] = [];
  
  // Handle RSS format
  if (result.rss?.channel?.item) {
    const rssItems = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];
    
    rssItems.forEach((item: any, idx: number) => {
      items.push({
        id: `${source.id}-${Date.now()}-${idx}`,
        title: item.title || 'Untitled Event',
        date: item.pubDate ? new Date(item.pubDate) : new Date(),
        venue: item.venue || undefined,
        location: item.location || undefined,
        link: item.link || undefined,
        description: item.description || undefined,
        source: source.name
      });
    });
  }
  
  // Handle Atom format
  if (result.feed?.entry) {
    const atomEntries = Array.isArray(result.feed.entry) 
      ? result.feed.entry 
      : [result.feed.entry];
    
    atomEntries.forEach((entry: any, idx: number) => {
      items.push({
        id: `${source.id}-${Date.now()}-${idx}`,
        title: entry.title || 'Untitled Event',
        date: entry.published ? new Date(entry.published) : new Date(),
        link: entry.link?.['@_href'] || undefined,
        description: entry.summary || entry.content || undefined,
        source: source.name
      });
    });
  }
  
  return items;
};

export const runOnce = async (concurrency = 3, failureThreshold = 5): Promise<{
  success: number;
  failed: number;
  items: FeedItem[];
  errors: string[];
}> => {
  const sources = loadSources();
  const enabledSources = sources.filter(s => s.enabled && s.failureCount < failureThreshold);
  
  const limit = pLimit(concurrency);
  const results: FeedItem[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;
  
  const promises = enabledSources.map(source =>
    limit(async () => {
      try {
        console.log(`📥 Fetching: ${source.name}`);
        const items = await parseFeed(source);
        
        source.failureCount = 0;
        source.lastFetch = new Date();
        source.lastSuccess = new Date();
        successCount++;
        
        results.push(...items);
        console.log(`✅ ${source.name}: ${items.length} items`);
        
        return items;
      } catch (error: any) {
        source.failureCount++;
        source.lastFetch = new Date();
        failedCount++;
        
        const errorMsg = `❌ ${source.name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
        
        return [];
      }
    })
  );
  
  await Promise.all(promises);
  
  saveSources(sources);
  saveMetadata({
    lastRun: new Date(),
    totalItems: results.length,
    successCount,
    failedCount,
    errors
  });
  
  return {
    success: successCount,
    failed: failedCount,
    items: results,
    errors
  };
};

export const startPoller = async (intervalSeconds = 60, concurrency = 3) => {
  if (pollerRunning) {
    console.log('⚠️  Poller already running');
    return;
  }
  
  pollerRunning = true;
  console.log(`🚀 Starting feed poller (every ${intervalSeconds}s)`);
  
  // Run immediately
  await runOnce(concurrency);
  
  // Then run on interval
  pollerInterval = setInterval(async () => {
    if (pollerRunning) {
      await runOnce(concurrency);
    }
  }, intervalSeconds * 1000);
};

export const stopPoller = () => {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
  pollerRunning = false;
  console.log('🛑 Feed poller stopped');
};

export const simulate = async () => {
  console.log('🔍 Running feed poller simulation...\n');
  const result = await runOnce(3, 5);
  
  console.log('\n📊 Simulation Summary:');
  console.log(`✅ Successful: ${result.success}`);
  console.log(`❌ Failed: ${result.failed}`);
  console.log(`📝 Total items: ${result.items.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.forEach(err => console.log(`  ${err}`));
  }
  
  return result;
};
