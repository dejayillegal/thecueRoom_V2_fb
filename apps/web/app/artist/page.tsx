import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbClient } from "@thecueroom/db/client";
import { users, profiles, forumThreads } from "@thecueroom/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { generateDeterministicAvatar } from "@/lib/artist-identity";
import ArtistSocialClient from "./ArtistSocialClient";

export default async function ArtistDirectoryPage() {
  const session = await getSession();
  if (!session || (session.role !== 'artist' && session.role !== 'admin')) {
    redirect('/dashboard');
  }

  const db = getDbClient();
  
  const rawArtists = await db.select({
    id: users.id,
    username: users.username,
    role: users.role,
  }).from(users).where(eq(users.role, 'artist')).limit(20);

  const artistProfiles = await db.select().from(profiles).where(
    inArray(profiles.userId, rawArtists.map(a => a.id))
  );
  
  const profileMap = new Map(artistProfiles.map(p => [p.userId, p]));
  
  const artists = rawArtists.map((a) => {
    const profile = profileMap.get(a.id);
    return {
      id: a.id,
      username: a.username || 'Unknown',
      displayName: profile?.artistName || profile?.displayName || a.username || 'Unknown',
      avatar: generateDeterministicAvatar(a.id)
    };
  });

  const myProfile = await db.select().from(profiles).where(eq(profiles.userId, session.uid)).limit(1);
  const mySocialLinks = (myProfile[0]?.socialLinks as Record<string, any>) || {};
  const myFollowing: string[] = mySocialLinks._following || [];

  const threads = await db.select({
    id: forumThreads.id,
    title: forumThreads.title,
    createdAt: forumThreads.createdAt,
    userId: forumThreads.userId,
    username: users.username,
    replyCount: forumThreads.replyCount,
    likesCount: forumThreads.likesCount
  })
  .from(forumThreads)
  .leftJoin(users, eq(forumThreads.userId, users.id))
  .where(eq(forumThreads.moderationStatus, 'approved'))
  .orderBy(desc(forumThreads.createdAt))
  .limit(20);

  const feedAll = (threads || []).map((t: any) => ({
    id: t.id,
    type: 'thread' as const,
    artistName: t.username || 'Unknown',
    username: t.username || 'unknown',
    avatar: generateDeterministicAvatar(t.userId!),
    content: t.title,
    timestamp: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
    stats: {
      replies: t.replyCount || 0,
      signals: t.likesCount || 0
    },
    isFollowing: myFollowing.includes(t.username || '')
  }));

  const feedFollowing = feedAll.filter(f => f.isFollowing);
  const feed = feedFollowing.length > 0 ? feedFollowing : feedAll.slice(0, 10);

  return <ArtistSocialClient initialArtists={artists} initialFeed={feed} />;
}
