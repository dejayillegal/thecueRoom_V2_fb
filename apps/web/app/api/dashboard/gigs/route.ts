import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@thecueroom/db';
import { gigs, users, profiles } from '@thecueroom/db/schema';
import { gte, desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const upcomingGigs = await db.select({
      id: gigs.id,
      title: gigs.title,
      description: gigs.description,
      venue: gigs.venue,
      location: gigs.location,
      startTime: gigs.startTime,
      endTime: gigs.endTime,
      status: gigs.status,
      createdAt: gigs.createdAt,
      userId: gigs.userId,
      userEmail: users.email,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
    })
    .from(gigs)
    .leftJoin(users, eq(gigs.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(gte(gigs.startTime, now))
    .orderBy(gigs.startTime)
    .limit(10);

    return NextResponse.json({ gigs: upcomingGigs });
  } catch (error) {
    console.error('Dashboard gigs error:', error);
    return NextResponse.json({ error: 'Failed to fetch gigs' }, { status: 500 });
  }
}
