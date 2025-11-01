
import { NextResponse } from 'next/server';
import { readCache } from '@thecueroom/feeds/cache';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'india-gigs-aggregated';
const DIAGNOSTICS_FILE = join(process.cwd(), 'logs/feeds/diagnostics.jsonl');

export async function GET() {
  try {
    const cached = readCache(CACHE_KEY);
    const cacheAgeSec = cached ? Math.floor((Date.now() - cached.timestamp) / 1000) : null;
    
    let diagnostics: any[] = [];
    if (existsSync(DIAGNOSTICS_FILE)) {
      const lines = readFileSync(DIAGNOSTICS_FILE, 'utf-8').trim().split('\n');
      diagnostics = lines.slice(-30).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    const sources: Record<string, any> = {};
    diagnostics.forEach(diag => {
      if (diag.source) {
        sources[diag.source] = {
          lastAttemptMs: diag.timestamp,
          method: diag.method,
          statusCode: diag.statusCode,
          itemCount: diag.itemCount,
          durationMs: diag.durationMs,
          lastError: diag.error
        };
      }
    });

    return NextResponse.json({
      cacheAgeSec,
      fromCache: !!cached,
      eventsCount: cached?.data?.events?.length || 0,
      sampleEvent: cached?.data?.events?.[0] || null,
      sources
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      cacheAgeSec: null,
      fromCache: false,
      eventsCount: 0,
      sources: {}
    });
  }
}
