import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { aiJobs, memes } from '@thecueroom/db/schema';
import { eq, gte, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [coverArtWeekly, epkWeekly, memesWeekly, coverArtMonthly, epkMonthly, memesMonthly] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(aiJobs).where(
        and(
          eq(aiJobs.type, 'cover-art'),
          gte(aiJobs.createdAt, sevenDaysAgo)
        )
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(aiJobs).where(
        and(
          eq(aiJobs.type, 'epk'),
          gte(aiJobs.createdAt, sevenDaysAgo)
        )
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(memes).where(
        gte(memes.createdAt, sevenDaysAgo)
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(aiJobs).where(
        and(
          eq(aiJobs.type, 'cover-art'),
          gte(aiJobs.createdAt, thirtyDaysAgo)
        )
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(aiJobs).where(
        and(
          eq(aiJobs.type, 'epk'),
          gte(aiJobs.createdAt, thirtyDaysAgo)
        )
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(memes).where(
        gte(memes.createdAt, thirtyDaysAgo)
      ),
    ]);

    return NextResponse.json({
      ok: true,
      usage: {
        coverArt: {
          weekly: coverArtWeekly[0]?.count || 0,
          monthly: coverArtMonthly[0]?.count || 0,
          usage: coverArtWeekly[0]?.count || 0,
          newTemplates: 5,
          recentCount: coverArtWeekly[0]?.count || 0,
        },
        epk: {
          weekly: epkWeekly[0]?.count || 0,
          monthly: epkMonthly[0]?.count || 0,
          usage: epkWeekly[0]?.count || 0,
          newTemplates: 2,
          recentCount: epkWeekly[0]?.count || 0,
        },
        meme: {
          weekly: memesWeekly[0]?.count || 0,
          monthly: memesMonthly[0]?.count || 0,
          usage: memesWeekly[0]?.count || 0,
          newTemplates: 8,
          recentCount: memesWeekly[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('[AI Tools Usage API] Error:', error);

    return NextResponse.json({
      ok: true,
      usage: {
        coverArt: { weekly: 0, monthly: 0, usage: 0, newTemplates: 5, recentCount: 0 },
        epk: { weekly: 0, monthly: 0, usage: 0, newTemplates: 2, recentCount: 0 },
        meme: { weekly: 0, monthly: 0, usage: 0, newTemplates: 8, recentCount: 0 },
      },
    });
  }
}
