import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbClient } from "@thecueroom/db/client";
import { users, profiles, forumThreads } from "@thecueroom/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { resolveAvatar } from "@/lib/artist-identity";
import ArtistSocialClient from "./ArtistSocialClient";

export default async function ArtistDirectoryPage() {
  const session = await getSession();
  if (!session || (session.role !== 'artist' && session.role !== 'admin')) {
    redirect('/dashboard');
  }

  const db = getDbClient();
  
  const rawArtists: any = await db.select({
    id: users.id,
    username: users.username,
    role: users.role,
  }).from(users).where(eq(users.role, 'artist')).limit(50);

  const allProfiles = await db.select().from(profiles);
  const profileMap = new Map(allProfiles.map((p: any) => [p.userId, p]));
  
  const myProfile: any = profileMap.get(session.uid);
  const mySocialLinks = (myProfile?.socialLinks as Record<string, any>) || {};
  const myFollowing: string[] = mySocialLinks._following || [];

  let myFollowers = 0;
  for (const p of allProfiles) {
    const links = (p.socialLinks as Record<string, any>) || {};
    const following: string[] = links._following || [];
    if (following.includes(session.username || '')) {
      myFollowers++;
    }
  }

  const currentUser = {
    id: session.uid,
    username: session.username || 'unknown',
    artistName: (myProfile?.artistName || myProfile?.displayName || session.username || 'Artist') as string,
    avatar: resolveAvatar(myProfile, session.uid),
    bio: (myProfile?.bio || '') as string,
    following: myFollowing.length,
    followers: myFollowers
  };

  const artists = rawArtists.map((a: any) => {
    const profile: any = profileMap.get(a.id);
    const socialLinks = (profile?.socialLinks as Record<string, any>) || {};
    const following: string[] = socialLinks._following || [];
    
    let followers = 0;
    for (const p of allProfiles) {
      const links = (p.socialLinks as Record<string, any>) || {};
      const f: string[] = links._following || [];
      if (f.includes(a.username || '')) followers++;
    }

    return {
      id: a.id,
      username: a.username || 'Unknown',
      displayName: (profile?.artistName || profile?.displayName || a.username || 'Unknown') as string,
      avatar: resolveAvatar(profile, a.id),
      bio: (profile?.bio || '') as string,
      isFollowing: myFollowing.includes(a.username || ''),
      followers,
      following: following.length
    };
  });

  const threads: any = await db.select({
    id: forumThreads.id,
    title: forumThreads.title,
    body: forumThreads.body,
    createdAt: forumThreads.createdAt,
    userId: forumThreads.userId,
    username: users.username,
    replyCount: forumThreads.replyCount,
    likesCount: forumThreads.likesCount
  })
  .from(forumThreads)
  .leftJoin(users, eq(forumThreads.userId, users.id as any))
  .where(eq(forumThreads.moderationStatus, 'approved'))
  .orderBy(desc(forumThreads.createdAt as any))
  .limit(30);

  const feedAll = (threads || [])
    .filter((t: any) => t.id && t.userId)
    .map((t: any) => {
      const authorProfile: any = allProfiles.find((p: any) => p.userId === t.userId);
      return {
        id: t.id,
        type: 'thread' as const,
        artistName: (authorProfile?.artistName || authorProfile?.displayName || t.username || 'Unknown') as string,
        username: (t.username || 'unknown') as string,
        avatar: resolveAvatar(authorProfile, t.userId),
        title: (t.title || '') as string,
        content: (t.body?.substring(0, 200) || t.title || '') as string,
        timestamp: t.createdAt ? new Date(t.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recently',
        stats: {
          replies: (t.replyCount || 0) as number,
          signals: (t.likesCount || 0) as number
        },
        isFollowing: myFollowing.includes(t.username || ''),
        isOwn: t.userId === session.uid
      };
    });

  const feedFollowing = feedAll.filter((f: any) => f.isFollowing || f.isOwn);
  const feed = feedFollowing.length >= 3 ? feedFollowing : feedAll.slice(0, 15);

  return <ArtistSocialClient currentUser={currentUser} initialArtists={artists} initialFeed={feed} />;
}
