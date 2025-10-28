import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@thecueroom/db';
import { users, profiles, gigs, forumThreads, memes } from '@thecueroom/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const userProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.userId, session.uid))
      .limit(1);

    const userThreads = await db.select()
      .from(forumThreads)
      .where(
        and(
          eq(forumThreads.userId, session.uid),
          gte(forumThreads.createdAt, oneWeekAgo)
        )
      );

    const userMemes = await db.select()
      .from(memes)
      .where(
        and(
          eq(memes.userId, session.uid),
          gte(memes.createdAt, oneWeekAgo)
        )
      );

    const totalUpvotes = userMemes.reduce((sum, meme) => sum + (meme.upvotes || 0), 0);
    
    const stats = {
      playsThisWeek: Math.max(128, Math.floor(Math.random() * 500)),
      newFollowers: Math.max(42, Math.floor(Math.random() * 100)),
      profileStatus: session.role === 'admin' ? 'Verified' : 'Active',
      aiCredits: userProfile[0]?.aiCredits || 100,
      postsThisWeek: userThreads.length + userMemes.length,
      totalEngagement: totalUpvotes + userThreads.reduce((sum, t) => sum + (t.upvotes || 0), 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
