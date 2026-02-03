import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { generateDeterministicAvatar } from '@/lib/artist-identity';
import { notFound } from 'next/navigation';
import { ExternalLink, Music, Globe, Instagram, Youtube, Twitter, Disc, Radio } from 'lucide-react';
import { Metadata } from 'next';
import { cn } from '@/lib/utils';

const detectType = (url: string) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('spotify.com')) return 'spotify';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('soundcloud.com')) return 'soundcloud';
  if (lowerUrl.includes('apple.com/music')) return 'apple';
  if (lowerUrl.includes('bandcamp.com')) return 'bandcamp';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) return 'x';
  return 'other';
};

const getLinkIcon = (type: string) => {
  switch (type) {
    case 'spotify': return Disc;
    case 'youtube': return Youtube;
    case 'soundcloud': return Radio;
    case 'apple': return Music;
    case 'bandcamp': return Disc;
    case 'instagram': return Instagram;
    case 'x': return Twitter;
    default: return Globe;
  }
};

const themes = {
  'dark-minimal': {
    bg: 'bg-[#0B0B0B]',
    card: 'bg-zinc-900/40 border-white/5 hover:border-white/20',
    accent: 'text-[#D7FF3C]',
    glow: 'bg-[#D7FF3C]/5',
    text: 'text-zinc-400'
  },
  'neon-underground': {
    bg: 'bg-[#050505]',
    card: 'bg-[#111]/80 border-[#D7FF3C]/10 hover:border-[#D7FF3C]/40 shadow-[0_0_15px_rgba(215,255,60,0.05)]',
    accent: 'text-[#D7FF3C]',
    glow: 'bg-[#D7FF3C]/10',
    text: 'text-[#D7FF3C]/60'
  },
  'monochrome-signal': {
    bg: 'bg-black',
    card: 'bg-white/5 border-white/10 hover:bg-white/10 transition-all',
    accent: 'text-white',
    glow: 'bg-white/5',
    text: 'text-zinc-500'
  },
  'pulse-gradient': {
    bg: 'bg-[#0B0B0B] bg-gradient-to-b from-[#1a0b2e] to-[#0B0B0B]',
    card: 'bg-white/5 border-white/10 hover:bg-[#9B5CFF]/10 hover:border-[#9B5CFF]/40',
    accent: 'text-[#9B5CFF]',
    glow: 'bg-[#9B5CFF]/10',
    text: 'text-[#9B5CFF]/60'
  }
};

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
  const avatarUrl = profile?.avatar || generateDeterministicAvatar(user.id);
  
  const socialLinksData = profile?.socialLinks as any || {};
  const linksArray = Array.isArray(socialLinksData.links) ? socialLinksData.links : (Array.isArray(socialLinksData) ? socialLinksData : []);
  const themeKey = socialLinksData.theme || 'dark-minimal';
  const theme = themes[themeKey as keyof typeof themes] || themes['dark-minimal'];

  const visibleLinks = linksArray.filter((l: any) => l.url && l.visible !== false).map((link: any) => {
    const type = link.type || detectType(link.url);
    return {
      label: link.label || type.charAt(0).toUpperCase() + type.slice(1),
      url: link.url,
      type,
      Icon: getLinkIcon(type)
    };
  });

  const artistName = profile?.artistName || profile?.displayName || user.username;

  return (
    <div className={cn("min-h-screen text-white flex flex-col items-center justify-start px-4 py-16", theme.bg)}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={cn("absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] blur-[150px] rounded-full", theme.glow)} />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 mb-6 shadow-2xl">
          <img src={avatarUrl} alt={artistName} className="w-full h-full object-cover" />
        </div>
        
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold tracking-tight mb-1">{artistName}</h1>
          <p className={cn("text-sm font-medium", theme.text)}>@{cleanUsername}</p>
        </div>

        {profile?.bio && (
          <p className="text-sm text-zinc-400 text-center max-w-xs mb-10 leading-relaxed font-medium">
            {profile.bio}
          </p>
        )}

        <div className="w-full space-y-4">
          {visibleLinks.map((link, i) => (
            <a
              key={`${link.url}-${i}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-4 w-full p-4 border transition-all group relative overflow-hidden rounded-xl",
                theme.card
              )}
            >
              <div className="w-10 h-10 bg-white/5 border border-white/5 flex items-center justify-center shrink-0 rounded-lg">
                <link.Icon size={20} className={theme.accent} />
              </div>
              
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold tracking-tight text-white block truncate">
                  {link.label}
                </span>
              </div>
              
              <ExternalLink size={14} className="text-zinc-600 group-hover:text-white transition-colors" />
            </a>
          ))}
          
          {visibleLinks.length === 0 && (
            <div className="py-12 text-center opacity-50">
              <p className="text-sm text-zinc-500">No signals detected</p>
            </div>
          )}
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-700">
            <div className={cn("w-1.5 h-1.5 rounded-full", theme.accent.replace('text-', 'bg-'))} />
            <span className="text-[10px] uppercase tracking-widest font-bold">thecueRoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
