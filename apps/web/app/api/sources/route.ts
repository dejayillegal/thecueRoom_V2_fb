import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { sources } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDbClient();
    
    const allSources = await db
      .select({
        id: sources.id,
        name: sources.name,
        url: sources.url,
        tags: sources.tags,
        enabled: sources.enabled,
      })
      .from(sources)
      .where(eq(sources.enabled, true));

    return NextResponse.json({
      data: allSources,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Sources API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources', data: [] },
      { status: 500 }
    );
  }
}
