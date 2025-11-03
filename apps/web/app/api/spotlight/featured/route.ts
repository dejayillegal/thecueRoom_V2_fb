import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { artistSpotlight, users, profiles } from '@thecueroom/db/schema';
import { eq, desc, and, gt } from 'drizzle-orm';

const db = getDbClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const now = new Date();

    const featured = await db
      .select({
        spotlight: artistSpotlight,
        user: users,
        profile: profiles,
      })
      .from(artistSpotlight)
      .innerJoin(users, eq(artistSpotlight.userId, users.id))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(
        and(
          eq(artistSpotlight.status, 'active'),
          gt(artistSpotlight.featuredUntil, now)
        )
      )
      .orderBy(desc(artistSpotlight.weight), desc(artistSpotlight.approvedAt))
      .limit(limit);

    const formattedResults = featured.map(({ spotlight, user, profile }) => ({
      id: spotlight.id,
      userId: user.id,
      username: user.username,
      displayName: profile?.displayName || user.username,
      artistName: profile?.artistName,
      bio: profile?.bio,
      avatar: profile?.avatar,
      genre: profile?.genre,
      region: profile?.region,
      socialLinks: profile?.socialLinks,
      weight: spotlight.weight,
      featuredUntil: spotlight.featuredUntil,
    }));

    return NextResponse.json({
      ok: true,
      featured: formattedResults,
    });
  } catch (error) {
    console.error('Featured artists error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured artists' },
      { status: 500 }
    );
  }
}
