import { checkArtistAccess } from '@/lib/artist-access';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, forumThreads, forumReplies } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateUndergroundUsername, generateDeterministicAvatar } from '@/lib/artist-identity';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Shield, MapPin, Globe, User, ExternalLink, MessageSquare, Zap, Share2, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await checkArtistAccess();
  const db = getDbClient();
  
  const { id: artistId } = await params;
  
  const artistRecords = await db.select().from(users).where(eq(users.id, artistId)).limit(1);
  if (artistRecords.length === 0 || (artistRecords[0].role !== 'artist' && artistRecords[0].role !== 'admin')) {
    return <div className="p-10 text-center text-zinc-500">Artist profile not found or access restricted.</div>;
  }
  
  const artist = artistRecords[0];
  const profileRecords = await db.select().from(profiles).where(eq(profiles.userId, artist.id)).limit(1);
  const profile = profileRecords[0];
  
  const threads = await db.select().from(forumThreads).where(eq(forumThreads.userId, artist.id)).orderBy(desc(forumThreads.createdAt)).limit(5);
  const replies = await db.select().from(forumReplies).where(eq(forumReplies.userId, artist.id)).orderBy(desc(forumReplies.createdAt)).limit(10);
  
  const undergroundName = generateUndergroundUsername(artist.id);
  const avatarUrl = generateDeterministicAvatar(artist.id);
  
  const activityCount = threads.length + replies.length;
  let tier = { label: 'Signal Initiate', color: 'bg-zinc-800' };
  if (activityCount > 15) tier = { label: 'Core Node', color: 'bg-purple-600' };
  else if (activityCount > 10) tier = { label: 'Scene Operator', color: 'bg-[#D1FF3D] text-black' };
  else if (activityCount > 5) tier = { label: 'Frequency Builder', color: 'bg-blue-600' };

  // Derived Link Data (Milkshake-style)
  const links = [
    { label: 'LATEST RELEASE', url: '#', icon: Music, color: 'text-[#D1FF3D]' },
    { label: 'BOOKING INQUIRIES', url: '#', icon: ExternalLink, color: 'text-white' },
    { label: 'PRESS KIT', url: `/ai/epk-generator`, icon: Share2, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D1FF3D] selection:text-black">
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D1FF3D]/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:px-8">
        {/* Navigation Affordance */}
        <Link href="/artist" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Signal Layer
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Identity & Milkshake Links */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="relative group">
               <div className="w-full aspect-square bg-zinc-900 border border-white/10 overflow-hidden relative">
                 <img src={avatarUrl} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                 <div className="absolute bottom-0 left-0 p-6 w-full">
                    <Badge className={`${tier.color} rounded-none font-mono text-[9px] uppercase tracking-[0.2em] mb-2`}>{tier.label}</Badge>
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-tight">{profile?.artistName || artist.username}</h1>
                    <p className="text-[11px] font-mono text-[#D1FF3D] lowercase opacity-70">@{undergroundName}</p>
                 </div>
               </div>
               {/* Online Status Pulse */}
               <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-full">
                 <div className="w-2 h-2 bg-[#D1FF3D] rounded-full animate-pulse shadow-[0_0_8px_#D1FF3D]" />
                 <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-300">LIVE</span>
               </div>
            </div>

            {/* Milkshake Link Hub */}
            <section className="space-y-3">
              <h2 className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 pl-2">Sync Nodes</h2>
              <div className="space-y-2">
                {links.map((link) => (
                  <Link key={link.label} href={link.url} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 hover:border-[#D1FF3D]/30 transition-all group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D1FF3D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                      <link.icon size={16} className={link.color} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 group-hover:text-white transition-colors">{link.label}</span>
                    </div>
                    <ExternalLink size={14} className="text-zinc-700 group-hover:text-[#D1FF3D] transition-colors" />
                  </Link>
                ))}
                <button className="w-full p-4 border border-dashed border-white/10 text-zinc-600 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
                  <Plus size={14} />
                  <span className="text-[9px] uppercase tracking-[0.3em]">Add Link Node</span>
                </button>
              </div>
            </section>

            {/* Bio Segment */}
            <section className="bg-zinc-900/30 border border-white/5 p-6 space-y-4">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 border-b border-white/5 pb-2">Operational Bio</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{profile?.bio || 'Zero bio data recorded for this node.'}</p>
            </section>
          </aside>

          {/* Right: Activity Stream & Stats */}
          <main className="lg:col-span-8 space-y-12">
            {/* Social Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Signals', value: activityCount, icon: Zap },
                { label: 'Reach', value: '1.2k', icon: Activity },
                { label: 'Followers', value: '342', icon: Users },
                { label: 'Karma', value: activityCount * 12, icon: Shield },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-900/30 border border-white/5 p-6 flex flex-col items-center justify-center gap-2 group hover:border-[#D1FF3D]/20 transition-all">
                  <stat.icon size={16} className="text-zinc-600 group-hover:text-[#D1FF3D] transition-colors" />
                  <span className="text-2xl font-black tracking-tighter text-white">{stat.value}</span>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500">{stat.label}</span>
                </div>
              ))}
            </div>

            <Tabs defaultValue="signals" className="w-full">
              <TabsList className="bg-transparent border-b border-white/5 w-full justify-start h-auto p-0 gap-8 mb-8">
                <TabsTrigger value="signals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D1FF3D] bg-transparent text-zinc-500 data-[state=active]:text-white uppercase tracking-[0.3em] text-[10px] py-4 px-0">Activity Signals</TabsTrigger>
                <TabsTrigger value="network" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D1FF3D] bg-transparent text-zinc-500 data-[state=active]:text-white uppercase tracking-[0.3em] text-[10px] py-4 px-0">Network Sync</TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="space-y-4 outline-none">
                {threads.length === 0 && replies.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/10 text-zinc-600 uppercase text-[10px] tracking-widest">No signal detected in local zone.</div>
                )}
                
                {threads.map(thread => (
                  <div key={thread.id} className="bg-zinc-900/40 border border-white/5 p-6 group hover:border-[#D1FF3D]/30 transition-all flex gap-6">
                    <div className="w-10 h-10 bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                      <Zap size={16} className="text-[#D1FF3D]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-[#D1FF3D] transition-colors">{thread.title}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Broadcasted Thread</span>
                        <span className="text-[10px] text-zinc-700 font-mono">/ {new Date(thread.createdAt!).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {replies.map(reply => (
                  <div key={reply.id} className="bg-zinc-900/40 border border-white/5 p-6 group hover:border-purple-500/30 transition-all flex gap-6">
                    <div className="w-10 h-10 bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                      <MessageSquare size={16} className="text-purple-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-300 font-light italic line-clamp-2">"{reply.body}"</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Signal Response</span>
                        <span className="text-[10px] text-zinc-700 font-mono">/ {new Date(reply.createdAt!).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="network" className="space-y-6 outline-none">
                <div className="bg-zinc-900/20 border border-white/5 p-8 text-center space-y-4">
                  <Globe size={48} className="mx-auto text-zinc-700 animate-pulse" />
                  <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 max-w-xs mx-auto leading-loose">
                    This node is synchronized with the global thecueRoom network layer.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
