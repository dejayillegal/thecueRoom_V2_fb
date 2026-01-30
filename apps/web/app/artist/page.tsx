import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbClient } from "@thecueroom/db/client";
import { users, forumThreads, forumReplies } from "@thecueroom/db/schema";
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
  
  const artists = rawArtists.map(a => ({
    id: a.id,
    username: a.username || a.email?.split('@')[0] || 'Unknown',
    undergroundName: generateUndergroundUsername(a.id),
    avatar: generateDeterministicAvatar(a.id)
  }));

  const threads = await db.select({
    id: forumThreads.id,
    title: forumThreads.title,
    createdAt: forumThreads.createdAt,
    userId: forumThreads.userId,
    user: users
  })
  .from(forumThreads)
  .leftJoin(users, eq(forumThreads.userId, users.id))
  .orderBy(desc(forumThreads.createdAt))
  .limit(10);

  const feed = threads.map(t => ({
    id: t.id,
    type: 'thread' as const,
    artistName: t.user?.username || t.user?.email?.split('@')[0] || 'Unknown',
    undergroundName: generateUndergroundUsername(t.userId!),
    avatar: generateDeterministicAvatar(t.userId!),
    content: t.title,
    timestamp: new Date(t.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    stats: {
      replies: Math.floor(Math.random() * 20),
      signals: Math.floor(Math.random() * 50)
    }
  }));

  return <ArtistSocialClient initialArtists={artists} initialFeed={feed} />;
}
