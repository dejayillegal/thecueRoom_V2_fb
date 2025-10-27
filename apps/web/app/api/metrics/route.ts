
import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { sources, fetchLogs } from '@thecueroom/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDbClient();
    
    const allSources = await db.select().from(sources);
    
    const recentLogs = await db
      .select()
      .from(fetchLogs)
      .orderBy(desc(fetchLogs.startedAt))
      .limit(100);
    
    const successCount = recentLogs.filter(log => log.status === 'success').length;
    const failureCount = recentLogs.filter(log => log.status === 'error').length;
    
    const metrics = {
      sources: {
        total: allSources.length,
        enabled: allSources.filter(s => s.enabled).length,
        circuitOpen: allSources.filter(s => s.circuitOpenUntil && new Date(s.circuitOpenUntil) > new Date()).length,
        failing: allSources.filter(s => s.consecutiveFailures > 0).length,
      },
      fetches: {
        recent: recentLogs.length,
        successful: successCount,
        failed: failureCount,
        successRate: recentLogs.length > 0 ? (successCount / recentLogs.length * 100).toFixed(2) + '%' : 'N/A',
      },
      performance: {
        averageFetchTime: allSources
          .filter(s => s.averageFetchTime)
          .reduce((sum, s) => sum + (s.averageFetchTime || 0), 0) / allSources.filter(s => s.averageFetchTime).length || 0,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'public, s-maxage=30',
      },
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
