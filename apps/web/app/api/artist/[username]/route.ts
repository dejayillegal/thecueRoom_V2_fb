import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, forumThreads, forumReplies } from '@thecueroom/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { generateDeterministicAvatar } from '@/lib/artist-identity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const db = getDbClient();

    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (userRecords.length === 0 || (userRecords[0].role !== 'artist' && userRecords[0].role !== 'admin')) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const user = userRecords[0];
    const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    const profile = profileRecords[0];

    const [threadsCount] = await db.select({ count: sql<number>`count(*)` }).from(forumThreads).where(eq(forumThreads.userId, user.id));
    const [repliesCount] = await db.select({ count: sql<number>`count(*)` }).from(forumReplies).where(eq(forumReplies.userId, user.id));

    const socialLinks = (profile?.socialLinks as Record<string, any>) || {};
    const following: string[] = socialLinks._following || [];
    const visibleLinks = Object.entries(socialLinks)
      .filter(([key]) => !key.startsWith('_'))
      .map(([label, url]) => ({ label, url }));

    const allProfiles = await db.select({
      userId: profiles.userId,
      socialLinks: profiles.socialLinks
    }).from(profiles);

    let followersCount = 0;
    for (const p of allProfiles) {
      const links = (p.socialLinks as Record<string, any>) || {};
      const theirFollowing: string[] = links._following || [];
      if (theirFollowing.includes(username)) {
        followersCount++;
      }
    }

    const threads = await db.select().from(forumThreads)
      .where(eq(forumThreads.userId, user.id))
      .orderBy(desc(forumThreads.createdAt))
      .limit(10);

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      verified: user.verified,
      artistName: profile?.artistName || profile?.displayName || user.username,
      displayName: profile?.displayName,
      bio: profile?.bio,
      genre: profile?.genre,
      region: profile?.region,
      avatar: generateDeterministicAvatar(user.id),
      socialLinks: visibleLinks,
      stats: {
        threads: Number(threadsCount?.count || 0),
        replies: Number(repliesCount?.count || 0),
        following: following.length,
        followers: followersCount
      },
      recentThreads: threads.map(t => ({
        id: t.id,
        title: t.title,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    console.error('Artist fetch error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
