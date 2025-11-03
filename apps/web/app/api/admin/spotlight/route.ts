import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { artistSpotlight, users, profiles, notifications } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const db = getDbClient();

const updateSchema = z.object({
  spotlightId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  weight: z.number().int().min(1).max(10).optional(),
  featuredUntil: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const spotlights = await db
      .select({
        spotlight: artistSpotlight,
        user: users,
        profile: profiles,
      })
      .from(artistSpotlight)
      .innerJoin(users, eq(artistSpotlight.userId, users.id))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(artistSpotlight.status, status))
      .orderBy(desc(artistSpotlight.requestedAt));

    const formattedResults = spotlights.map(({ spotlight, user, profile }) => ({
      id: spotlight.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      displayName: profile?.displayName || user.username,
      artistName: profile?.artistName,
      bio: profile?.bio,
      avatar: profile?.avatar,
      genre: profile?.genre,
      region: profile?.region,
      weight: spotlight.weight,
      status: spotlight.status,
      requestedAt: spotlight.requestedAt,
      featuredUntil: spotlight.featuredUntil,
      approvedAt: spotlight.approvedAt,
    }));

    return NextResponse.json({
      ok: true,
      spotlights: formattedResults,
    });
  } catch (error) {
    console.error('Admin spotlight list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spotlight requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    if (data.action === 'approve') {
      const featuredUntil = data.featuredUntil
        ? new Date(data.featuredUntil)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      const [updated] = await db
        .update(artistSpotlight)
        .set({
          status: 'active',
          weight: data.weight || 1,
          featuredUntil,
          approvedBy: session.uid,
          approvedAt: new Date(),
        })
        .where(eq(artistSpotlight.id, data.spotlightId))
        .returning();

      await db.insert(notifications).values({
        userId: updated.userId,
        type: 'spotlight_approved',
        title: 'Spotlight Approved!',
        message: `Your spotlight request has been approved and will be featured until ${featuredUntil.toLocaleDateString()}.`,
        link: '/dashboard',
      });

      return NextResponse.json({
        ok: true,
        spotlight: updated,
        message: 'Spotlight approved successfully',
      });
    } else {
      const [updated] = await db
        .update(artistSpotlight)
        .set({
          status: 'rejected',
        })
        .where(eq(artistSpotlight.id, data.spotlightId))
        .returning();

      await db.insert(notifications).values({
        userId: updated.userId,
        type: 'spotlight_rejected',
        title: 'Spotlight Request Update',
        message: 'Your spotlight request could not be approved at this time.',
        link: '/dashboard',
      });

      return NextResponse.json({
        ok: true,
        spotlight: updated,
        message: 'Spotlight rejected',
      });
    }
  } catch (error) {
    console.error('Admin spotlight update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update spotlight' },
      { status: 500 }
    );
  }
}
