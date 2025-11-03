import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { views } from '@thecueroom/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const db = getDbClient();

const viewSchema = z.object({
  targetType: z.enum(['thread', 'post', 'profile', 'epk', 'meme', 'event']),
  targetId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = viewSchema.parse(body);
    
    const session = await getSession();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await db.insert(views).values({
      targetType: data.targetType,
      targetId: data.targetId,
      userId: session?.uid || null,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: 'View recorded',
    });
  } catch (error) {
    console.error('View tracking error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: 'targetType and targetId required' },
        { status: 400 }
      );
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(views)
      .where(
        and(
          eq(views.targetType, targetType),
          eq(views.targetId, targetId)
        )
      );

    return NextResponse.json({
      ok: true,
      count: result?.count || 0,
    });
  } catch (error) {
    console.error('Get views error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch views' },
      { status: 500 }
    );
  }
}
