'use client';

import { motion } from 'framer-motion';
import { 
  Activity, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Zap, 
  Search,
  ArrowRight,
  Shield,
  Music,
  User as UserIcon
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SignalEntry {
  id: string;
  type: 'thread' | 'comment';
  artistName: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: string;
  stats: {
    replies: number;
    signals: number;
  }
}

const Waveform = () => (
  <div className="flex items-center gap-[2px] h-4">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="w-[2px] bg-[#D1FF3D]"
        animate={{ 
          height: [4, 16, 8, 12, 6][i % 5],
          opacity: [0.3, 1, 0.5, 0.8, 0.4][i % 5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

export default function ArtistSocialClient({ 
  initialArtists, 
  initialFeed 
}: { 
  initialArtists: any[], 
  initialFeed: SignalEntry[] 
}) {
  const navigateToArtist = (username: string) => {
    window.location.href = `/artist/u/${username}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D1FF3D] selection:text-black">
      {/* Background Pulse Systems */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D1FF3D]/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-8 lg:px-8">
        {/* Top Header System */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div className="space-y-2">
                      <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase leading-none">
                        Artist <span className="text-zinc-500">Social</span>
                      </h1>
            <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#D1FF3D] rounded-full animate-ping" />
                Network Live
              </span>
              <span>/</span>
              <span>Encrypted Layer</span>
              <span>/</span>
              <Waveform />
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#D1FF3D] transition-colors" />
            <Input 
              placeholder="SEARCH FREQUENCIES..." 
              className="bg-zinc-900/50 border-white/5 rounded-none pl-10 h-12 text-[10px] uppercase tracking-widest focus:ring-[#D1FF3D] focus:border-[#D1FF3D]/50 transition-all"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Identity Panel */}
          <aside className="lg:col-span-3 space-y-8">
            <section className="bg-zinc-900/30 border border-white/5 p-6 space-y-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 border-b border-white/5 pb-3">
                Global Nodes
              </h2>
              <div className="space-y-4">
                {initialArtists.slice(0, 6).map((artist, i) => (
                  <motion.div 
                    key={artist.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() => navigateToArtist(artist.username)}
                  >
                    <div className="w-10 h-10 bg-zinc-800 border border-white/10 overflow-hidden relative grayscale group-hover:grayscale-0 transition-all">
                      <img src={artist.avatar} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-tight group-hover:text-[#D1FF3D] transition-colors line-clamp-1">
                        {artist.displayName}
                      </p>
                      <p className="text-[9px] font-mono text-zinc-600 lowercase">@{artist.username}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="w-full py-3 border border-white/5 text-[9px] uppercase tracking-[0.3em] text-zinc-500 hover:bg-[#D1FF3D] hover:text-black transition-all">
                View Directory
              </button>
            </section>

            <section className="bg-[#D1FF3D]/5 border border-[#D1FF3D]/10 p-6 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap className="w-12 h-12 text-[#D1FF3D]" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D1FF3D]">Artist Spotlight</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                "The social layer is where the underground becomes a network. Connect, signal, and sync."
              </p>
            </section>
          </aside>

          {/* Center: Activity Feed */}
          <main className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-[#D1FF3D]" />
                <h2 className="text-xs font-bold uppercase tracking-[0.3em]">Signal Stream</h2>
              </div>
              <div className="flex gap-2">
                {['Live', 'Rising', 'Archived'].map(filter => (
                  <button key={filter} className="px-3 py-1 bg-zinc-900 border border-white/5 text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {initialFeed.map((signal, i) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-900/40 border border-white/5 p-6 hover:border-[#D1FF3D]/20 transition-all group relative"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-zinc-800 border border-white/10 overflow-hidden group-hover:border-[#D1FF3D]/50 transition-colors">
                        <img src={signal.avatar} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-tight hover:text-[#D1FF3D] cursor-pointer" onClick={() => navigateToArtist(signal.username)}>
                            {signal.artistName}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-600 lowercase">@{signal.username}</span>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-700 uppercase">{signal.timestamp}</span>
                      </div>
                      
                      <p className="text-sm text-zinc-300 leading-relaxed font-light line-clamp-3 group-hover:line-clamp-none transition-all">
                        {signal.content}
                      </p>

                      <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-1.5 text-zinc-500 hover:text-white cursor-pointer transition-colors">
                          <MessageSquare size={12} />
                          <span className="text-[10px] font-mono">{signal.stats.replies}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 hover:text-[#D1FF3D] cursor-pointer transition-colors">
                          <Zap size={12} />
                          <span className="text-[10px] font-mono">{signal.stats.signals}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </main>

          {/* Right: Network Stats & Presence */}
          <aside className="lg:col-span-3 space-y-8">
            <section className="bg-zinc-900/30 border border-white/5 p-6 space-y-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 border-b border-white/5 pb-3">
                Network Vitals
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-zinc-600" />
                    <span className="text-[10px] uppercase text-zinc-400">Nodes Online</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#D1FF3D]">{initialArtists.length * 3 + 12}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-zinc-600" />
                    <span className="text-[10px] uppercase text-zinc-400">Signal Density</span>
                  </div>
                  <span className="text-[10px] font-mono text-white">4.2 GHz</span>
                </div>
                <div className="pt-4 space-y-2">
                   <div className="h-[1px] bg-white/5 w-full" />
                   <p className="text-[8px] font-mono text-zinc-700 uppercase leading-loose">
                     LATENCY: 12ms<br/>
                     STATUS: OPTIMIZED<br/>
                     ZONE: GLOBAL_NET
                   </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 pl-2">Active Signals</h3>
              <div className="space-y-2">
                {['Production Rituals', 'Gear Talk', 'Live Sets'].map((tag, i) => (
                  <div key={tag} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 group hover:border-[#D1FF3D]/20 cursor-pointer transition-all">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-white">#{tag.replace(' ', '_')}</span>
                    <ArrowRight size={12} className="text-zinc-700 group-hover:text-[#D1FF3D] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
