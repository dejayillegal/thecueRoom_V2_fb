import { checkArtistAccess } from '@/lib/artist-access';
import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, forumThreads, forumReplies } from '@thecueroom/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { generateUndergroundUsername, generateDeterministicAvatar } from '@/lib/artist-identity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Shield, MapPin, Globe, User } from 'lucide-react';
import Image from 'next/image';

export default async function ArtistProfilePage({ params }: { params: { id: string } }) {
  await checkArtistAccess();
  const db = getDbClient();
  
  const artistId = params.id;
  
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
  
  // Deterministic Tier Logic
  const activityCount = threads.length + replies.length;
  let tier = { label: 'Signal Initiate', color: 'bg-zinc-800' };
  if (activityCount > 15) tier = { label: 'Core Node', color: 'bg-purple-600' };
  else if (activityCount > 10) tier = { label: 'Scene Operator', color: 'bg-[#D1FF3D] text-black' };
  else if (activityCount > 5) tier = { label: 'Frequency Builder', color: 'bg-blue-600' };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="relative group overflow-hidden border border-white/10 p-6 sm:p-8 bg-black/40 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1FF3D]/5 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-none border-2 border-[#D1FF3D]/20 overflow-hidden bg-zinc-900">
                <img src={avatarUrl} alt={artist.username} className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <div className="w-4 h-4 bg-[#D1FF3D] rounded-full animate-pulse shadow-[0_0_10px_#D1FF3D]" />
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">{profile?.artistName || artist.username}</h1>
                <Badge className={`${tier.color} rounded-none font-mono text-[10px] uppercase tracking-widest`}>{tier.label}</Badge>
              </div>
              <p className="font-mono text-[#D1FF3D] text-xs lowercase opacity-70">@{undergroundName}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2 text-zinc-500 text-[10px] uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1"><MapPin size={12} /> {profile?.region || 'Void'}</span>
                <span className="flex items-center gap-1"><Globe size={12} /> {profile?.genre || 'Undefined'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="bg-transparent border-b border-white/5 w-full justify-start h-auto rounded-none p-0 gap-8">
            <TabsTrigger value="feed" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D1FF3D] bg-transparent text-zinc-500 data-[state=active]:text-white uppercase tracking-[0.3em] text-[10px] py-4">Activity Feed</TabsTrigger>
            <TabsTrigger value="identity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D1FF3D] bg-transparent text-zinc-500 data-[state=active]:text-white uppercase tracking-[0.3em] text-[10px] py-4">Identity Core</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feed" className="pt-6 space-y-4">
            {threads.length === 0 && replies.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 text-zinc-600 uppercase text-[10px] tracking-widest">No signal detected in feed.</div>
            )}
            
            {threads.map(thread => (
              <Card key={thread.id} className="bg-black/20 border-white/5 rounded-none hover:border-[#D1FF3D]/30 transition-colors">
                <CardHeader className="p-4 flex flex-row items-center gap-3">
                  <div className="p-2 bg-zinc-900 border border-white/5"><Activity size={14} className="text-[#D1FF3D]" /></div>
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium tracking-tight uppercase">{thread.title}</CardTitle>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Created Thread • {new Date(thread.createdAt!).toLocaleDateString()}</p>
                  </div>
                </CardHeader>
              </Card>
            ))}
            
            {replies.map(reply => (
              <Card key={reply.id} className="bg-black/20 border-white/5 rounded-none hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-4 flex flex-row items-center gap-3">
                  <div className="p-2 bg-zinc-900 border border-white/5"><User size={14} className="text-purple-400" /></div>
                  <div className="space-y-1">
                    <p className="text-sm font-light text-zinc-300 line-clamp-1 italic">"{reply.body}"</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Replied to Thread • {new Date(reply.createdAt!).toLocaleDateString()}</p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="identity" className="pt-6 space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="bg-black/20 border-white/10 rounded-none p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5 pb-2">Bio Data</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-light">{profile?.bio || 'Zero bio data recorded for this node.'}</p>
                </Card>
                
                <Card className="bg-black/20 border-white/10 rounded-none p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5 pb-2">Network Credentials</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] uppercase">
                      <span className="text-zinc-500">Node Status</span>
                      <span className="text-[#D1FF3D] font-bold">Active</span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase">
                      <span className="text-zinc-500">Reputation Karma</span>
                      <span className="text-white">{activityCount * 12} points</span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase">
                      <span className="text-zinc-500">Longevity</span>
                      <span className="text-white">Est. {new Date(artist.createdAt!).getFullYear()}</span>
                    </div>
                  </div>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
