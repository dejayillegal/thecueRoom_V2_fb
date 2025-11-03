import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { reactions } from '@thecueroom/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const db = getDbClient();

const reactionSchema = z.object({
  targetType: z.enum(['thread', 'post', 'profile', 'epk', 'meme', 'event']),
  targetId: z.string().uuid(),
  reaction: z.enum(['like', 'love', 'fire', 'laugh']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = reactionSchema.parse(body);

    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.targetType, data.targetType),
          eq(reactions.targetId, data.targetId),
          eq(reactions.userId, session.uid)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].reaction === data.reaction) {
        await db
          .delete(reactions)
          .where(eq(reactions.id, existing[0].id));
        
        return NextResponse.json({
          ok: true,
          action: 'removed',
          message: 'Reaction removed',
        });
      } else {
        await db
          .update(reactions)
          .set({ reaction: data.reaction })
          .where(eq(reactions.id, existing[0].id));
        
        return NextResponse.json({
          ok: true,
          action: 'updated',
          message: 'Reaction updated',
        });
      }
    }

    const [newReaction] = await db
      .insert(reactions)
      .values({
        targetType: data.targetType,
        targetId: data.targetId,
        userId: session.uid,
        reaction: data.reaction,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      action: 'added',
      reaction: newReaction,
      message: 'Reaction added',
    });
  } catch (error) {
    console.error('Reaction error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add reaction' },
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

    const reactionsList = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId)
        )
      );

    const summary = reactionsList.reduce((acc: Record<string, number>, r) => {
      acc[r.reaction] = (acc[r.reaction] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      reactions: reactionsList,
      summary,
      total: reactionsList.length,
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}
