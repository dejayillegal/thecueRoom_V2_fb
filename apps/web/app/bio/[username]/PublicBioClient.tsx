'use client';

import { ExternalLink, Music, Globe, Instagram, Youtube, Twitter, Disc, Radio } from 'lucide-react';

interface BioLink {
  label: string;
  url: string;
  type: string;
  thumbnail?: string;
}

interface PublicBioClientProps {
  username: string;
  artistName: string;
  bio: string;
  avatarUrl: string;
  links: BioLink[];
  theme: string;
}

const themes: Record<string, {
  bg: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  accent: string;
  accentGlow: string;
  text: string;
  textSecondary: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  'dark-minimal': {
    bg: 'bg-[#0B0B0B]',
    cardBg: 'bg-zinc-900/40',
    cardBorder: 'border-white/5',
    cardHover: 'hover:border-[#D1FF3D]/40 hover:bg-zinc-900/60',
    accent: 'text-[#D1FF3D]',
    accentGlow: 'shadow-[0_0_20px_rgba(209,255,61,0.1)]',
    text: 'text-white',
    textSecondary: 'text-zinc-500',
    gradientFrom: 'from-[#D1FF3D]/5',
    gradientTo: 'to-transparent',
  },
  'neon-underground': {
    bg: 'bg-[#0a0012]',
    cardBg: 'bg-purple-950/30',
    cardBorder: 'border-purple-500/20',
    cardHover: 'hover:border-[#9B5CFF]/60 hover:bg-purple-950/50',
    accent: 'text-[#9B5CFF]',
    accentGlow: 'shadow-[0_0_30px_rgba(155,92,255,0.2)]',
    text: 'text-white',
    textSecondary: 'text-purple-300/60',
    gradientFrom: 'from-[#9B5CFF]/10',
    gradientTo: 'to-transparent',
  },
  'monochrome-signal': {
    bg: 'bg-[#121212]',
    cardBg: 'bg-neutral-900/50',
    cardBorder: 'border-neutral-700/30',
    cardHover: 'hover:border-neutral-500/50 hover:bg-neutral-800/60',
    accent: 'text-neutral-300',
    accentGlow: 'shadow-[0_0_15px_rgba(255,255,255,0.05)]',
    text: 'text-neutral-100',
    textSecondary: 'text-neutral-500',
    gradientFrom: 'from-white/5',
    gradientTo: 'to-transparent',
  },
  'pulse-gradient': {
    bg: 'bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a1a2e]',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    cardHover: 'hover:border-cyan-400/40 hover:bg-white/10',
    accent: 'text-cyan-400',
    accentGlow: 'shadow-[0_0_25px_rgba(34,211,238,0.15)]',
    text: 'text-white',
    textSecondary: 'text-cyan-200/50',
    gradientFrom: 'from-cyan-400/10',
    gradientTo: 'to-purple-500/10',
  },
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

export default function PublicBioClient({ 
  username, 
  artistName, 
  bio, 
  avatarUrl, 
  links, 
  theme: themeName 
}: PublicBioClientProps) {
  const theme = themes[themeName] || themes['dark-minimal'];

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-start px-4 py-12`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] ${theme.gradientFrom} blur-[150px] rounded-full`} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${theme.cardBorder} bg-zinc-900 ${theme.accentGlow}`}>
            <img src={avatarUrl} alt={artistName} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">{artistName}</h1>
            <p className={`text-sm font-mono ${theme.accent} lowercase tracking-widest opacity-70`}>@{username}</p>
          </div>
          {bio && (
            <p className={`text-sm ${theme.textSecondary} text-center max-w-xs leading-relaxed font-medium`}>{bio}</p>
          )}
        </div>

        <div className="space-y-4">
          {links.map((link, i) => {
            const Icon = getLinkIcon(link.type);
            const color = getIconColor(link.type);
            
            return (
              <a
                key={`${link.url}-${i}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 w-full p-4 ${theme.cardBg} border ${theme.cardBorder} ${theme.cardHover} transition-all group relative overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="w-12 h-12 bg-black/40 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden relative z-10">
                  {link.thumbnail ? (
                    <img src={link.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <Icon size={20} style={{ color }} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.text} group-hover:${theme.accent} transition-colors block truncate`}>
                    {link.label}
                  </span>
                </div>
                
                <ExternalLink size={14} className={`${theme.textSecondary} group-hover:${theme.accent} transition-colors relative z-10`} />
              </a>
            );
          })}
          
          {links.length === 0 && (
            <div className={`py-12 text-center border border-dashed ${theme.cardBorder} rounded-sm`}>
              <p className={`text-sm ${theme.textSecondary}`}>No links yet</p>
            </div>
          )}
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-700">
            <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: themes[themeName]?.accent.replace('text-[', '').replace(']', '') || '#D1FF3D' }} />
            <span className="text-[9px] uppercase tracking-widest font-mono">thecueRoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
