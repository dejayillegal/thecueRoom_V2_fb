import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@thecueroom/db';
import { forumThreads, memes, gigs, users, profiles } from '@thecueroom/db/schema';
import { desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recentThreads = await db.select({
      id: forumThreads.id,
      userId: forumThreads.userId,
      title: forumThreads.title,
      content: forumThreads.content,
      createdAt: forumThreads.createdAt,
      upvotes: forumThreads.upvotes,
      commentCount: forumThreads.commentCount,
      userEmail: users.email,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
    })
    .from(forumThreads)
    .leftJoin(users, eq(forumThreads.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .orderBy(desc(forumThreads.createdAt))
    .limit(5);

    const recentMemes = await db.select({
      id: memes.id,
      userId: memes.userId,
      template: memes.template,
      imageUrl: memes.imageUrl,
      createdAt: memes.createdAt,
      upvotes: memes.upvotes,
      userEmail: users.email,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
    })
    .from(memes)
    .leftJoin(users, eq(memes.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .orderBy(desc(memes.createdAt))
    .limit(5);

    const recentGigs = await db.select({
      id: gigs.id,
      userId: gigs.userId,
      title: gigs.title,
      venue: gigs.venue,
      location: gigs.location,
      startTime: gigs.startTime,
      createdAt: gigs.createdAt,
      status: gigs.status,
      userEmail: users.email,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
    })
    .from(gigs)
    .leftJoin(users, eq(gigs.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .orderBy(desc(gigs.createdAt))
    .limit(5);

    const activities = [
      ...recentThreads.map(t => ({
        id: t.id,
        type: 'forum_post',
        title: t.title,
        content: t.content?.substring(0, 100),
        timestamp: t.createdAt,
        user: {
          name: t.displayName || t.userEmail?.split('@')[0] || 'Anonymous',
          avatar: t.avatar
        },
        metadata: {
          upvotes: t.upvotes,
          comments: t.commentCount
        }
      })),
      ...recentMemes.map(m => ({
        id: m.id,
        type: 'meme',
        title: `Posted a ${m.template} meme`,
        timestamp: m.createdAt,
        user: {
          name: m.displayName || m.userEmail?.split('@')[0] || 'Anonymous',
          avatar: m.avatar
        },
        metadata: {
          upvotes: m.upvotes,
          imageUrl: m.imageUrl
        }
      })),
      ...recentGigs.map(g => ({
        id: g.id,
        type: 'gig',
        title: g.title,
        content: `${g.venue} - ${g.location}`,
        timestamp: g.createdAt,
        user: {
          name: g.displayName || g.userEmail?.split('@')[0] || 'Anonymous',
          avatar: g.avatar
        },
        metadata: {
          status: g.status,
          startTime: g.startTime
        }
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
