import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import PublicBioClient from "./PublicBioClient";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = username.replace(/^(@|%40)/, '');

  const db = getDbClient();
  const userRecords = await db.select().from(users).where(eq(users.username, cleanUsername)).limit(1);
  const user = userRecords[0];
  
  if (!user) return { title: 'Artist Not Found' };
  
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = profileRecords[0];
  
  return {
    title: `${profile?.artistName || profile?.displayName || cleanUsername} | thecueRoom`,
    description: profile?.bio || `${cleanUsername}'s bio link on thecueRoom`,
  };
}

export default async function PublicBioPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const cleanUsername = username.replace(/^(@|%40)/, '');

  const db = getDbClient();
  
  const userRecords = await db.select().from(users).where(eq(users.username, cleanUsername)).limit(1);
  if (userRecords.length === 0) return notFound();
  
  const user = userRecords[0];
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = profileRecords[0];
  
  const socialLinksData = profile?.socialLinks as any || {};
  const linksArray = Array.isArray(socialLinksData.links) ? socialLinksData.links : (Array.isArray(socialLinksData) ? socialLinksData : []);
  const themeKey = socialLinksData.theme || 'dark-minimal';

  const bioLinks = linksArray.filter((l: any) => l.url && l.visible !== false).map((link: any) => ({
    label: link.label || 'Link',
    url: link.url,
    type: link.type || 'other'
  }));

  return (
    <PublicBioClient
      username={user.username || 'unknown'}
      artistName={(profile?.artistName || profile?.displayName || user.username || 'Artist') as string}
      bio={(profile?.bio || '') as string}
      profile={profile}
      links={bioLinks}
      theme={themeKey}
    />
  );
}
