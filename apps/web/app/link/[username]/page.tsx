import { getDbClient } from '@thecueroom/db/client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { generateDeterministicAvatar } from '@/lib/artist-identity';
import { notFound } from 'next/navigation';
import { ExternalLink, Music, Globe, Instagram, Youtube, Twitter, Disc, Radio } from 'lucide-react';

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

const getIconColor = (type: string) => {
  switch (type) {
    case 'spotify': return '#1DB954';
    case 'youtube': return '#FF0000';
    case 'soundcloud': return '#FF3300';
    case 'apple': return '#FA243C';
    case 'bandcamp': return '#629AA9';
    case 'instagram': return '#E4405F';
    case 'x': return '#1DA1F2';
    default: return '#D1FF3D';
  }
};

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
  
  const socialLinks = profile?.socialLinks || [];
  const visibleLinks = (Array.isArray(socialLinks) ? socialLinks : []).filter((l: any) => l.visible !== false).map((link: any) => {
    const type = link.type || detectType(link.url);
    return {
      label: link.label,
      url: link.url,
      type,
      thumbnail: link.thumbnail,
      Icon: getLinkIcon(type),
      color: getIconColor(type)
    };
  });

  const artistName = profile?.artistName || profile?.displayName || user.username;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-start px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D1FF3D]/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D1FF3D]/30 bg-zinc-900 shadow-[0_0_20px_rgba(209,255,61,0.1)]">
            <img src={avatarUrl} alt={artistName} className="w-full h-full object-cover grayscale" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">{artistName}</h1>
            <p className="text-sm font-mono text-[#D1FF3D] lowercase tracking-widest opacity-70">@{username}</p>
          </div>
          {profile?.bio && (
            <p className="text-sm text-zinc-500 text-center max-w-xs leading-relaxed font-medium">{profile.bio}</p>
          )}
        </div>

        <div className="space-y-4">
          {visibleLinks.map((link, i) => (
            <a
              key={`${link.url}-${i}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full p-4 bg-zinc-900/40 border border-white/5 hover:border-[#D1FF3D]/40 hover:bg-zinc-900/60 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#D1FF3D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-12 h-12 bg-black/40 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden relative z-10">
                {link.thumbnail ? (
                  <img src={link.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <link.Icon size={20} style={{ color: link.color }} />
                )}
              </div>
              
              <div className="flex-1 min-w-0 relative z-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white group-hover:text-[#D1FF3D] transition-colors block truncate">
                  {link.label}
                </span>
              </div>
              
              <ExternalLink size={14} className="text-zinc-700 group-hover:text-[#D1FF3D] transition-colors relative z-10" />
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
