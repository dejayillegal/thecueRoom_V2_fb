
import { NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs } from '@thecueroom/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDbClient();
    const jobs = await db.select()
      .from(verificationJobs)
      .orderBy(desc(verificationJobs.createdAt))
      .limit(100);

    return NextResponse.json({ ok: true, jobs });
  } catch (error: any) {
    console.error('Queue fetch error:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}
