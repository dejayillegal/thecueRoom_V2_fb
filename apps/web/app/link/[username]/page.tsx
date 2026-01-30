import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { generateDeterministicAvatar } from '@/lib/artist-identity';
import { notFound } from 'next/navigation';
import { ExternalLink, Music, Globe, Instagram, Youtube, Twitter } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const db = getDbClient();
  const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = userRecords[0];
  
  if (!user) return { title: 'Not Found' };
  
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = profileRecords[0];
  
  return {
    title: `${profile?.artistName || profile?.displayName || username} | thecueRoom`,
    description: profile?.bio || `${username}'s link page on thecueRoom`,
  };
}

const getLinkIcon = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes('spotify') || lower.includes('soundcloud') || lower.includes('music')) return Music;
  if (lower.includes('instagram') || lower.includes('ig')) return Instagram;
  if (lower.includes('youtube') || lower.includes('yt')) return Youtube;
  if (lower.includes('twitter') || lower.includes('x')) return Twitter;
  return Globe;
};

export default async function BioLinkPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const db = getDbClient();
  
  const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (userRecords.length === 0) {
    notFound();
  }
  
  const user = userRecords[0];
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = profileRecords[0];
  const avatarUrl = generateDeterministicAvatar(user.id);
  
  const socialLinks = (profile?.socialLinks as Record<string, any>) || {};
  const visibleLinks = Object.entries(socialLinks)
    .filter(([key]) => !key.startsWith('_'))
    .map(([label, url]) => ({ label, url: String(url), Icon: getLinkIcon(label) }));

  const artistName = profile?.artistName || profile?.displayName || user.username;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-start px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D1FF3D]/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D1FF3D]/30 bg-zinc-900">
            <img src={avatarUrl} alt={artistName} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight uppercase">{artistName}</h1>
            <p className="text-sm font-mono text-[#D1FF3D]/70 lowercase">@{username}</p>
          </div>
          {profile?.bio && (
            <p className="text-sm text-zinc-400 text-center max-w-xs leading-relaxed">{profile.bio}</p>
          )}
        </div>

        <div className="space-y-3">
          {visibleLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-4 bg-zinc-900/60 border border-white/10 hover:border-[#D1FF3D]/40 hover:bg-zinc-900 transition-all group rounded-sm"
            >
              <div className="flex items-center gap-4">
                <link.Icon size={20} className="text-[#D1FF3D]" />
                <span className="text-sm font-medium uppercase tracking-wider">{link.label}</span>
              </div>
              <ExternalLink size={16} className="text-zinc-600 group-hover:text-[#D1FF3D] transition-colors" />
            </a>
          ))}
          
          {visibleLinks.length === 0 && (
            <div className="py-12 text-center border border-dashed border-white/10 rounded-sm">
              <p className="text-sm text-zinc-600">No links yet</p>
            </div>
          )}
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <a 
            href={`/artist/u/${username}`}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-[#D1FF3D] transition-colors"
          >
            View Full Profile
          </a>
          <div className="flex items-center gap-2 text-zinc-700">
            <div className="w-1.5 h-1.5 bg-[#D1FF3D] rounded-full" />
            <span className="text-[9px] uppercase tracking-widest font-mono">thecueRoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
