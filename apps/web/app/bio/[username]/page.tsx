import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { generateDeterministicAvatar } from '@/lib/artist-identity';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import PublicBioClient from './PublicBioClient';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  let { username } = await params;
  if (username.startsWith('%40')) username = username.substring(3);
  if (username.startsWith('@')) username = username.substring(1);

  const db = getDbClient();
  const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = userRecords[0];
  
  if (!user) return { title: 'Artist Not Found' };
  
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = profileRecords[0];
  
  return {
    title: `${profile?.artistName || profile?.displayName || username} | thecueRoom`,
    description: profile?.bio || `${username}'s bio link on thecueRoom`,
    openGraph: {
      title: `${profile?.artistName || profile?.displayName || username}`,
      description: profile?.bio || `${username}'s bio link on thecueRoom`,
      type: 'profile',
    },
  };
}

export default async function PublicBioPage({ params }: { params: Promise<{ username: string }> }) {
  let { username } = await params;
  if (username.startsWith('%40')) username = username.substring(3);
  if (username.startsWith('@')) username = username.substring(1);

  const db = getDbClient();
  
  const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (userRecords.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-4">Artist Not Found</h1>
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Signal lost: @{username}</p>
        <a href="/" className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#D1FF3D] hover:underline">Return to Base</a>
      </div>
    );
  }
  
  const user = userRecords[0];
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = profileRecords[0];
  const avatarUrl = profile?.avatar || generateDeterministicAvatar(user.id);
  
  const socialLinks = profile?.socialLinks || [];
  const visibleLinks = (Array.isArray(socialLinks) ? socialLinks : []).filter((l: any) => l.visible !== false).map((link: any) => ({
    label: link.label,
    url: link.url,
    type: link.type || detectType(link.url),
    thumbnail: link.thumbnail,
  }));

  const artistName = profile?.artistName || profile?.displayName || user.username;
  const bio = profile?.bio || '';
  const theme = (profile?.bioTheme as string) || 'dark-minimal';

  return (
    <PublicBioClient
      username={username}
      artistName={artistName}
      bio={bio}
      avatarUrl={avatarUrl}
      links={visibleLinks}
      theme={theme}
    />
  );
}

function detectType(url: string) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('spotify.com')) return 'spotify';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('soundcloud.com')) return 'soundcloud';
  if (lowerUrl.includes('apple.com/music')) return 'apple';
  if (lowerUrl.includes('bandcamp.com')) return 'bandcamp';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) return 'x';
  return 'other';
}
