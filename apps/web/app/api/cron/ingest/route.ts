
import { NextRequest, NextResponse } from 'next/server';
import { ingestFeeds } from '../../../../../scripts/ingest-feeds';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting automated feed ingestion...');
    await ingestFeeds();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feed ingestion completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Feed ingestion error:', error);
    return NextResponse.json({ 
      error: 'Feed ingestion failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
