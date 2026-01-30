import { checkArtistAccess } from '@/lib/artist-access';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, forumThreads, forumReplies } from '@thecueroom/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { generateDeterministicAvatar } from '@/lib/artist-identity';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import ArtistProfileClient from './ArtistProfileClient';

export default async function ArtistProfileByUsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await checkArtistAccess();
  const db = getDbClient();
  
  const { username } = await params;
  
  const artistRecords = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (artistRecords.length === 0 || (artistRecords[0].role !== 'artist' && artistRecords[0].role !== 'admin')) {
    notFound();
  }
  
  const artist = artistRecords[0];
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, artist.id)).limit(1);
  const profile = profileRecords[0];
  const avatarUrl = generateDeterministicAvatar(artist.id);
  
  const socialLinks = (profile?.socialLinks as Record<string, any>) || {};
  const following: string[] = socialLinks._following || [];
  const visibleLinks = Object.entries(socialLinks)
    .filter(([key]) => !key.startsWith('_'))
    .map(([label, url]) => ({ label: label.toUpperCase(), url: String(url) }));

  const [threadsCount] = await db.select({ count: sql<number>`count(*)` }).from(forumThreads).where(eq(forumThreads.userId, artist.id));
  const [repliesCount] = await db.select({ count: sql<number>`count(*)` }).from(forumReplies).where(eq(forumReplies.userId, artist.id));
  const activityCount = Number(threadsCount?.count || 0) + Number(repliesCount?.count || 0);

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

  const threads = await db.select().from(forumThreads).where(eq(forumThreads.userId, artist.id)).orderBy(desc(forumThreads.createdAt)).limit(5);
  const replies = await db.select().from(forumReplies).where(eq(forumReplies.userId, artist.id)).orderBy(desc(forumReplies.createdAt)).limit(5);

  const myProfile = await db.select().from(profiles).where(eq(profiles.userId, session.uid)).limit(1);
  const mySocialLinks = (myProfile[0]?.socialLinks as Record<string, any>) || {};
  const myFollowing: string[] = mySocialLinks._following || [];
  const isFollowing = myFollowing.includes(username);
  const isOwnProfile = session.username === username;

  return (
    <ArtistProfileClient
      artist={{
        id: artist.id,
        username: artist.username,
        role: artist.role,
        verified: artist.verified || false,
        artistName: profile?.artistName || profile?.displayName || artist.username,
        displayName: profile?.displayName || artist.username,
        bio: profile?.bio || '',
        genre: profile?.genre || '',
        region: profile?.region || '',
        avatar: avatarUrl,
        socialLinks: visibleLinks,
      }}
      stats={{
        activity: activityCount,
        following: following.length,
        followers: followersCount,
        karma: activityCount * 12,
      }}
      threads={threads.map(t => ({
        id: t.id,
        title: t.title,
        createdAt: t.createdAt?.toISOString() || new Date().toISOString(),
      }))}
      replies={replies.map(r => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
      }))}
      isFollowing={isFollowing}
      isOwnProfile={isOwnProfile}
    />
  );
}
