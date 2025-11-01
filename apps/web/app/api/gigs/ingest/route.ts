
import { NextRequest, NextResponse } from 'next/server';
import { runOnce } from '@/../../packages/feeds/poller';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const METADATA_FILE = './.local/feeds/feed_metadata.json';

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin') === 'true';
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('🚀 Starting manual feed ingestion...');
    const result = await runOnce(3, 5);
    
    return NextResponse.json({
      success: true,
      stats: {
        successCount: result.success,
        failedCount: result.failed,
        itemsCount: result.items.length
      },
      items: result.items,
      errors: result.errors
    });
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      { error: 'Failed to run ingestion', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    if (!existsSync(METADATA_FILE)) {
      return NextResponse.json({ runs: [] });
    }
    
    const metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf-8'));
    
    return NextResponse.json({
      lastRun: metadata.lastRun,
      stats: {
        totalItems: metadata.totalItems,
        successCount: metadata.successCount,
        failedCount: metadata.failedCount
      },
      errors: metadata.errors || []
    });
  } catch (error) {
    console.error('Failed to load ingestion metadata:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}
