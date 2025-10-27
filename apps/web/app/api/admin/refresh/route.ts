
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { sources } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const refreshKey = request.headers.get('x-refresh-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!refreshKey || refreshKey !== process.env.REFRESH_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId parameter required' }, { status: 400 });
    }

    const db = getDbClient();
    
    const source = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId))
      .limit(1);

    if (source.length === 0) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Refresh triggered',
      sourceId,
      sourceName: source[0].name,
      note: 'Background worker will pick up this source on next cycle',
    });
  } catch (error) {
    console.error('Refresh trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger refresh' },
      { status: 500 }
    );
  }
}
