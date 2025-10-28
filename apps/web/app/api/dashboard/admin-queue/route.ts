import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@thecueroom/db';
import { users, profiles, gigs } from '@thecueroom/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ queue: [] });
    }

    const pendingGigs = await db.select({
      id: gigs.id,
      title: gigs.title,
      venue: gigs.venue,
      location: gigs.location,
      startTime: gigs.startTime,
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
    .where(eq(gigs.status, 'pending'))
    .orderBy(desc(gigs.createdAt))
    .limit(5);

    const recentUsers = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.role, 'user'))
    .orderBy(desc(users.createdAt))
    .limit(5);

    const queue = [
      ...pendingGigs.map(g => ({
        id: g.id,
        type: 'gig_review',
        title: `Review gig: ${g.title}`,
        description: `${g.venue} - ${g.location}`,
        timestamp: g.createdAt,
        user: {
          name: g.displayName || g.userEmail?.split('@')[0] || 'Anonymous',
          email: g.userEmail,
          avatar: g.avatar
        },
        status: 'pending'
      })),
      ...recentUsers.map(u => ({
        id: u.id,
        type: 'verification_request',
        title: `Artist verification request`,
        description: `Request from @${u.email?.split('@')[0]}`,
        timestamp: u.createdAt,
        user: {
          name: u.displayName || u.email?.split('@')[0] || 'Anonymous',
          email: u.email,
          avatar: u.avatar
        },
        status: 'pending'
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    return NextResponse.json({ queue });
  } catch (error) {
    console.error('Dashboard admin queue error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin queue' }, { status: 500 });
  }
}
