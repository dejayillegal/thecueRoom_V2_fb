import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { artistSpotlight, users } from '@thecueroom/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const db = getDbClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.uid))
      .limit(1);

    if (!user || user.role !== 'artist') {
      return NextResponse.json(
        { error: 'Only verified artists can request spotlight' },
        { status: 403 }
      );
    }

    const existingRequest = await db
      .select()
      .from(artistSpotlight)
      .where(
        and(
          eq(artistSpotlight.userId, session.uid),
          eq(artistSpotlight.status, 'pending')
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending spotlight request' },
        { status: 400 }
      );
    }

    const [spotlight] = await db
      .insert(artistSpotlight)
      .values({
        userId: session.uid,
        status: 'pending',
        weight: 1,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      spotlight,
      message: 'Spotlight request submitted successfully',
    });
  } catch (error) {
    console.error('Spotlight request error:', error);
    return NextResponse.json(
      { error: 'Failed to request spotlight' },
      { status: 500 }
    );
  }
}
