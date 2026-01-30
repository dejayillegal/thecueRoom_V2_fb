import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbClient } from "@thecueroom/db/client";
import { users, forumThreads } from "@thecueroom/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateUndergroundUsername, generateDeterministicAvatar } from "@/lib/artist-identity";
import ArtistSocialClient from "./ArtistSocialClient";

export default async function ArtistDirectoryPage() {
  const session = await getSession();
  if (!session || (session.role !== 'artist' && session.role !== 'admin')) {
    redirect('/dashboard');
  }

  const db = getDbClient();
  const rawArtists = await db.select().from(users).where(eq(users.role, 'artist')).limit(20);
  
  const artists = rawArtists.map((a: any) => ({
    id: a.id,
    username: a.username || 'Unknown',
    displayName: a.username || 'Unknown',
    avatar: generateDeterministicAvatar(a.id)
  }));

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
  .limit(10);

  const feed = (threads || []).map((t: any) => ({
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
    }
  }));

  return <ArtistSocialClient initialArtists={artists} initialFeed={feed} />;
}
