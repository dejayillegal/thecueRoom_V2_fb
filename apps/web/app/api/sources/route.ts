import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { sources } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDbClient();
    const allSources = await db.select().from(sources);

    return NextResponse.json({
      sources: allSources.map(source => ({
        ...source,
        enabled: source.enabled ?? true,
        failureCount: source.failureCount ?? 0,
      })),
      total: allSources.length,
    });
  } catch (error) {
    console.error('Sources API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}