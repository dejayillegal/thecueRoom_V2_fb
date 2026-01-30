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
  
  const artists = rawArtists.map(a => ({
    id: a.id,
    username: a.username || a.email?.split('@')[0] || 'Unknown',
    undergroundName: generateUndergroundUsername(a.id),
    avatar: generateDeterministicAvatar(a.id)
  }));

  // Fix: moderationStatus is the correct column name in schema.ts
  const threads = await (db.select({
    id: forumThreads.id,
    title: forumThreads.title,
    createdAt: forumThreads.createdAt,
    userId: forumThreads.userId,
    userName: users.username,
    userEmail: users.email
  } as any)
  .from(forumThreads)
  .leftJoin(users, eq(forumThreads.userId, users.id))
  .where(eq(forumThreads.moderationStatus, 'approved'))
  .orderBy(desc(forumThreads.createdAt))
  .limit(10) as any);

  const feed = (threads || []).map((t: any) => ({
    id: t.id,
    type: 'thread' as const,
    artistName: t.userName || t.userEmail?.split('@')[0] || 'Unknown',
    undergroundName: generateUndergroundUsername(t.userId!),
    avatar: generateDeterministicAvatar(t.userId!),
    content: t.title,
    timestamp: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
    stats: {
      replies: Math.floor(Math.random() * 20),
      signals: Math.floor(Math.random() * 50)
    }
  }));

  return <ArtistSocialClient initialArtists={artists} initialFeed={feed} />;
}
