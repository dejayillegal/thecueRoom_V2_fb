
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { views, forumThreads } from '@thecueroom/db/schema';
import { viewRecordSchema } from '@thecueroom/shared/forumSchemas';
import { getSession } from '@/lib/auth';
import { eq, and, sql, gt } from 'drizzle-orm';

const db = getDbClient();
const VIEW_THROTTLE_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const data = viewRecordSchema.parse(body);

    const userId = session?.uid || null;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Check for recent view (throttle)
    const throttleTime = new Date(Date.now() - VIEW_THROTTLE_MINUTES * 60 * 1000);
    
    const recentView = await db
      .select()
      .from(views)
      .where(
        and(
          eq(views.targetType, data.targetType),
          eq(views.targetId, data.targetId),
          userId ? eq(views.userId, userId) : eq(views.ipAddress, ipAddress),
          gt(views.createdAt, throttleTime)
        )
      )
      .limit(1);

    if (recentView.length > 0) {
      return NextResponse.json({ ok: true, counted: false });
    }

    // Record new view
    await db.insert(views).values({
      targetType: data.targetType,
      targetId: data.targetId,
      userId,
      ipAddress,
      userAgent: request.headers.get('user-agent'),
    });

    // Increment view counter for threads
    if (data.targetType === 'thread') {
      await db
        .update(forumThreads)
        .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
        .where(eq(forumThreads.id, data.targetId));
    }

    return NextResponse.json({ ok: true, counted: true });
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
