import { NextResponse } from 'next/server';
import { aggregateIndiaGigs } from '@thecueroom/feeds/sources/india-gigs-aggregator';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CACHE_FILE = join(process.cwd(), 'apps/web/data/gigs/india-latest.json');
const CACHE_DURATION = 3600000; // 1 hour

function ensureCacheDir() {
  const dir = join(process.cwd(), 'apps/web/data/gigs');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readCache() {
  try {
    if (!existsSync(CACHE_FILE)) {
      return null;
    }

    const data = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    const age = Date.now() - new Date(data.timestamp).getTime();

    if (age > CACHE_DURATION) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function writeCache(data: any) {
  try {
    ensureCacheDir();
    writeFileSync(CACHE_FILE, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }, null, 2));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function GET() {
  try {
    // Try cache first
    const cached = readCache();
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true,
      });
    }

    // Fetch fresh data
    const result = await aggregateIndiaGigs();

    const response = {
      events: result.events,
      sources: result.sources,
      total: result.events.length,
      timestamp: new Date().toISOString(),
    };

    // Cache the result
    writeCache(response);

    return NextResponse.json({
      ...response,
      fromCache: false,
    });

  } catch (error) {
    console.error('India gigs API error:', error);

    // Try to return stale cache on error
    const staleCache = readCache();
    if (staleCache) {
      return NextResponse.json({
        ...staleCache,
        fromCache: true,
        stale: true,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch gigs' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour