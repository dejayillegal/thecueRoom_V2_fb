
import { NextRequest, NextResponse } from 'next/server';
import { runEnhancedIngestion } from '../../../../../scripts/enhanced-ingest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

let lastRunTime: string | null = null;
let isRunning = false;

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured');
      return NextResponse.json({ 
        error: 'Server misconfigured: CRON_SECRET environment variable is required',
        hint: 'Add CRON_SECRET to your Replit Secrets'
      }, { status: 500 });
    }
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return NextResponse.json({ 
        error: 'Unauthorized: Missing Authorization header',
        hint: 'Add header: Authorization: Bearer YOUR_CRON_SECRET'
      }, { status: 401 });
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid CRON_SECRET');
      return NextResponse.json({ 
        error: 'Unauthorized: Invalid credentials' 
      }, { status: 401 });
    }

    if (isRunning) {
      return NextResponse.json({ 
        error: 'Feed ingestion already in progress',
        lastRun: lastRunTime
      }, { status: 429 });
    }

    isRunning = true;
    const startTime = new Date();
    
    console.log('🚀 Starting automated enhanced feed ingestion...');
    const result = await runEnhancedIngestion();
    
    lastRunTime = startTime.toISOString();
    isRunning = false;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Enhanced feed ingestion completed',
      timestamp: startTime.toISOString(),
      duration: Date.now() - startTime.getTime(),
      stats: result
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

export async function POST(request: NextRequest) {
  return GET(request);
}
