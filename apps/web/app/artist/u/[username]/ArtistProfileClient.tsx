'use client';

import { useState, useEffect } from 'react';
import { useFollow } from '@/hooks/useFollow';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, Shield, MapPin, Globe, ExternalLink, MessageSquare, 
  Zap, ArrowLeft, Music, Users, Edit, UserPlus, UserMinus, Share2 
} from 'lucide-react';
import Link from 'next/link';

interface ArtistProfileClientProps {
  artist: {
    id: string;
    username: string;
    role: string;
    verified: boolean;
    artistName: string;
    displayName: string;
    bio: string;
    genre: string;
    region: string;
    avatar: string;
    socialLinks: { label: string; url: string }[];
  };
  stats: {
    activity: number;
    following: number;
    followers: number;
    karma: number;
  };
  threads: { id: string; title: string; createdAt: string }[];
  replies: { id: string; body: string; createdAt: string }[];
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export default function ArtistProfileClient({ 
  artist, stats, threads, replies, isFollowing: initialIsFollowing, isOwnProfile 
}: ArtistProfileClientProps) {
  const { isFollowing, toggleFollow, isLoading } = useFollow(initialIsFollowing, artist.username);
  const [followersCount, setFollowersCount] = useState(stats.followers);

  const getTier = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { label: 'Admin', color: 'bg-red-500' };
      case 'artist':
        return { label: 'Artist', color: 'bg-[#D1FF3D]' };
      default:
        return { label: 'Member', color: 'bg-zinc-500' };
    }
  };

  const tier = getTier(artist.role);

  useEffect(() => {
    setFollowersCount(stats.followers + (isFollowing !== initialIsFollowing ? (isFollowing ? 1 : -1) : 0));
  }, [isFollowing, initialIsFollowing, stats.followers]);

  const handleShare = async () => {
    const url = `${window.location.origin}/link/${artist.username}`;
    if (navigator.share) {
      await navigator.share({ title: artist.artistName, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D1FF3D] selection:text-black">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D1FF3D]/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:px-8">
        <Link href="/artist" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Signal Layer
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
            >
              <div className="w-full aspect-square bg-zinc-900 border border-white/10 overflow-hidden relative">
                <img src={artist.avatar} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <Badge className={`${tier.color} rounded-none font-mono text-[9px] uppercase tracking-[0.2em] mb-2 text-black`}>{tier.label}</Badge>
                  <h1 className="text-3xl font-black tracking-tighter uppercase leading-tight">{artist.artistName}</h1>
                  <p className="text-[11px] font-mono text-[#D1FF3D] lowercase opacity-70">@{artist.username}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-full">
                <div className="w-2 h-2 bg-[#D1FF3D] rounded-full animate-pulse shadow-[0_0_8px_#D1FF3D]" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-300">LIVE</span>
              </div>
            </motion.div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <Link href="/settings" className="flex-1 py-3 bg-zinc-900 border border-white/10 text-center text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                  <Edit size={14} />
                  Edit Profile
                </Link>
              ) : (
                <button 
                  onClick={toggleFollow}
                  disabled={isLoading}
                  className={`flex-1 py-3 border text-center text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                    isFollowing 
                      ? 'bg-zinc-900 border-white/10 hover:bg-red-900/20 hover:border-red-500/30' 
                      : 'bg-[#D1FF3D] border-[#D1FF3D] text-black hover:bg-[#c5ea35]'
                  }`}
                >
                  {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                  {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
              <button 
                onClick={handleShare}
                className="px-4 py-3 bg-zinc-900 border border-white/10 text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                <Share2 size={14} />
              </button>
            </div>

            <section className="space-y-3">
              <h2 className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 pl-2">Sync Nodes</h2>
              <div className="space-y-2">
                {artist.socialLinks.map((link) => (
                  <a 
                    key={link.label} 
                    href={link.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 hover:border-[#D1FF3D]/30 transition-all group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D1FF3D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                      <Music size={16} className="text-[#D1FF3D]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 group-hover:text-white transition-colors">{link.label}</span>
                    </div>
                    <ExternalLink size={14} className="text-zinc-700 group-hover:text-[#D1FF3D] transition-colors" />
                  </a>
                ))}
                {artist.socialLinks.length === 0 && (
                  <div className="p-4 border border-dashed border-white/10 text-center text-[10px] text-zinc-600 uppercase tracking-widest">
                    No links added
                  </div>
                )}
              </div>
            </section>

            <section className="bg-zinc-900/30 border border-white/5 p-6 space-y-4">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 border-b border-white/5 pb-2">Bio</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{artist.bio || 'No bio yet.'}</p>
              {artist.genre && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <Music size={12} />
                  <span>{artist.genre}</span>
                </div>
              )}
              {artist.region && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <MapPin size={12} />
                  <span>{artist.region}</span>
                </div>
              )}
            </section>
          </aside>

          <main className="lg:col-span-8 space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Signals', value: stats.activity, icon: Zap },
                { label: 'Followers', value: followersCount, icon: Users },
                { label: 'Following', value: stats.following, icon: Activity },
                { label: 'Karma', value: stats.karma, icon: Shield },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-900/30 border border-white/5 p-6 flex flex-col items-center justify-center gap-2 group hover:border-[#D1FF3D]/20 transition-all">
                  <stat.icon size={16} className="text-zinc-600 group-hover:text-[#D1FF3D] transition-colors" />
                  <span className="text-2xl font-black tracking-tighter text-white">{stat.value}</span>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            <Tabs defaultValue="signals" className="w-full">
              <TabsList className="bg-transparent border-b border-white/5 w-full justify-start h-auto p-0 gap-8 mb-8">
                <TabsTrigger value="signals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D1FF3D] bg-transparent text-zinc-500 data-[state=active]:text-white uppercase tracking-[0.3em] text-[10px] py-4 px-0">Activity</TabsTrigger>
                <TabsTrigger value="network" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D1FF3D] bg-transparent text-zinc-500 data-[state=active]:text-white uppercase tracking-[0.3em] text-[10px] py-4 px-0">Network</TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="space-y-4 outline-none">
                {threads.length === 0 && replies.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/10 text-zinc-600 uppercase text-[10px] tracking-widest">No activity yet</div>
                )}
                
                {threads.map((thread, i) => (
                  <motion.div 
                    key={thread.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-zinc-900/40 border border-white/5 p-6 group hover:border-[#D1FF3D]/30 transition-all flex gap-6"
                  >
                    <div className="w-10 h-10 bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                      <Zap size={16} className="text-[#D1FF3D]" />
                    </div>
                    <div className="space-y-1">
                      <Link href={`/forum/thread/${thread.id}`}>
                        <h4 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-[#D1FF3D] transition-colors cursor-pointer">{thread.title}</h4>
                      </Link>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Thread</span>
                        <span className="text-[10px] text-zinc-700 font-mono">/ {new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {replies.map((reply, i) => (
                  <motion.div 
                    key={reply.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (threads.length + i) * 0.05 }}
                    className="bg-zinc-900/40 border border-white/5 p-6 group hover:border-purple-500/30 transition-all flex gap-6"
                  >
                    <div className="w-10 h-10 bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                      <MessageSquare size={16} className="text-purple-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-300 font-light italic line-clamp-2">"{reply.body}"</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Reply</span>
                        <span className="text-[10px] text-zinc-700 font-mono">/ {new Date(reply.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="network" className="space-y-6 outline-none">
                <div className="bg-zinc-900/20 border border-white/5 p-8 text-center space-y-4">
                  <Globe size={48} className="mx-auto text-zinc-700" />
                  <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 max-w-xs mx-auto leading-loose">
                    Connected to the thecueRoom artist network.
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
