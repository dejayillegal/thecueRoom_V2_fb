
import { NextRequest, NextResponse } from 'next/server';
import { ingestFeeds } from '../../../../../scripts/ingest-feeds';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

// Track last run time
let lastRunTime: string | null = null;
let isRunning = false;

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent concurrent runs
    if (isRunning) {
      return NextResponse.json({ 
        error: 'Feed ingestion already in progress',
        lastRun: lastRunTime
      }, { status: 429 });
    }

    isRunning = true;
    const startTime = new Date();
    
    console.log('Starting automated feed ingestion...');
    await ingestFeeds();
    
    lastRunTime = startTime.toISOString();
    isRunning = false;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feed ingestion completed',
      timestamp: startTime.toISOString(),
      duration: Date.now() - startTime.getTime()
    });
  } catch (error) {
    isRunning = false;
    console.error('Feed ingestion error:', error);
    return NextResponse.json({ 
      error: 'Feed ingestion failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      lastRun: lastRunTime
    }, { status: 500 });
  }
}

// Status endpoint
export async function POST(request: NextRequest) {
  return NextResponse.json({
    isRunning,
    lastRun: lastRunTime,
    status: isRunning ? 'running' : 'idle'
  });
}
