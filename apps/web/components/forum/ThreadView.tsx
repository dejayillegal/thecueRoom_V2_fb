'use client';

import { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Flag, Eye, Clock, Pin, Lock, CheckCircle2, ArrowLeft, Bookmark, Bell, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { UserProfileCard } from './UserProfileCard';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { getArtistProfileHref } from '@/lib/routing/getArtistProfileHref';

interface ThreadData {
  id: string;
  title: string;
  body: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
    genre?: string;
    region?: string;
    bio?: string;
  };
  category: string;
  tags: string[];
  createdAt: Date;
  views: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  replies: Reply[];
}

interface Reply {
  id: string;
  body: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
  };
  createdAt: Date;
  likes: number;
  isLiked: boolean;
}

const mockThread: ThreadData = {
  id: '1',
  title: "What's the best synth for a beginner under $500?",
  body: "I've been producing music in the box for the past year and I'm ready to get my first hardware synthesizer. My budget is around $500 and I'm interested in both FM and subtractive synthesis.\n\nI've been looking at:\n- Korg Minilogue XD\n- Arturia MicroFreak\n- Behringer DeepMind 6\n\nWhich one would you recommend for someone who wants to learn synthesis fundamentals while still being able to create professional-sounding patches? Also open to other suggestions!",
  author: {
    username: 'synthwave_kid',
    displayName: 'Alex Chen',
    verified: false,
    genre: 'Electronic',
    region: 'San Francisco',
    bio: 'Electronic music producer, synthesizer enthusiast',
  },
  category: 'Gear Talk',
  tags: ['synthesizers', 'beginner', 'hardware'],
  createdAt: new Date('2024-11-02T10:30:00'),
  views: 342,
  likes: 18,
  isPinned: false,
  isLocked: false,
  replies: [
    {
      id: 'r1',
      body: "I started with the Minilogue XD and it's absolutely fantastic for learning. The interface is super intuitive and the sound quality is professional-grade. Plus, you get both analog and digital oscillators which gives you a lot of versatility.",
      author: {
        username: 'jazzfusion_pro',
        displayName: 'Marcus J.',
        verified: true,
      },
      createdAt: new Date('2024-11-02T11:15:00'),
      likes: 12,
      isLiked: false,
    },
    {
      id: 'r2',
      body: 'MicroFreak is amazing if you want to explore experimental sounds! The matrix keyboard is unique and it has so many synthesis engines. Great value for money.',
      author: {
        username: 'modular_maven',
        displayName: 'Sarah K.',
        verified: false,
      },
      createdAt: new Date('2024-11-02T14:22:00'),
      likes: 8,
      isLiked: true,
    },
  ],
};

export function ThreadView({ threadId }: { threadId: string }) {
  const [thread] = useState<ThreadData>(mockThread);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-[#9B5CFF]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#D1FF3D]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10 relative z-10">
        <Link
          href="/community/forum"
          className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-[#D1FF3D] mb-12 transition-all"
        >
          <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:border-[#D1FF3D]/20">
            <ArrowLeft className="w-3 h-3" />
          </div>
          Return to Hub
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111111]/40 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl shadow-2xl"
            >
              <div className="p-10 border-b border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <span className="px-3 py-1 bg-[#9B5CFF]/10 text-[#9B5CFF] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#9B5CFF]/20">
                    {thread.category}
                  </span>
                  <div className="h-px w-12 bg-white/5" />
                  <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      <span>{thread.views} SIGS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(thread.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-8">
                  {thread.isPinned && (
                    <Pin className="w-6 h-6 text-[#D1FF3D] flex-shrink-0 mt-1" />
                  )}
                  <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-[0.9] text-pretty">
                    {thread.title}
                  </h1>
                </div>

                <div className="flex items-center justify-between pt-4">
                   <Link href={getArtistProfileHref(thread.author.username)} className="flex items-center gap-4 group/author">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D1FF3D] to-[#9B5CFF] p-[1px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-sm font-black text-white">
                          {thread.author.displayName[0]}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 group-hover/author:text-[#D1FF3D] transition-colors">
                          {thread.author.displayName}
                          {thread.author.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#D1FF3D]" />}
                        </h3>
                        <p className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">@{thread.author.username}</p>
                      </div>
                   </Link>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsLiked(!isLiked)}
                        className={`p-4 rounded-2xl border transition-all \${isLiked ? 'bg-[#D1FF3D]/10 border-[#D1FF3D]/30 text-[#D1FF3D]' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 \${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white transition-all">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white transition-all">
                        <Share2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>

              <div className="p-10">
                <div className="prose prose-invert max-w-none mb-10">
                  <p className="text-lg text-zinc-400 font-light whitespace-pre-wrap leading-relaxed italic border-l-2 border-[#D1FF3D]/10 pl-10">
                    {thread.body}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-10">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-4 py-2 bg-white/5 border border-white/5 text-zinc-500 rounded-full hover:border-[#D1FF3D]/20 hover:text-white transition-all cursor-pointer"
                    >
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.02] p-10 border-t border-white/5">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-[#D1FF3D]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                      {thread.replies.length} Responses Detected
                    </h3>
                  </div>
                </div>

                <div className="space-y-8">
                  {thread.replies.map((reply, idx) => (
                    <motion.div 
                      key={reply.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="group flex gap-6">
                        <div className="flex-shrink-0">
                          <Link href={getArtistProfileHref(reply.author.username)}>
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-zinc-500">
                              {reply.author.displayName[0]}
                            </div>
                          </Link>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Link href={getArtistProfileHref(reply.author.username)} className="text-xs font-black text-white uppercase tracking-widest group-hover:text-[#D1FF3D] transition-colors">
                              {reply.author.displayName}
                            </Link>
                            {reply.author.verified && <CheckCircle2 className="w-3 h-3 text-[#D1FF3D]" />}
                            <span className="text-[9px] text-zinc-600 font-mono">
                              @{reply.author.username} · {formatTimeAgo(reply.createdAt)}
                            </span>
                          </div>

                          <p className="text-sm text-zinc-400 font-light leading-relaxed group-hover:text-zinc-200 transition-colors">
                            {reply.body}
                          </p>

                          <div className="flex items-center gap-6 pt-2">
                            <button className="flex items-center gap-2 text-[9px] font-black text-zinc-600 hover:text-[#D1FF3D] transition-all uppercase tracking-widest">
                              <ThumbsUp className="w-3 h-3" />
                              {reply.likes} UPVOTES
                            </button>
                            <button className="text-[9px] font-black text-zinc-600 hover:text-white transition-all uppercase tracking-widest">
                              REPLY
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {!thread.isLocked && (
                  <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                       <Sparkles className="w-4 h-4 text-[#9B5CFF]" />
                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Broadcast Response</h4>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Input frequency..."
                      className="w-full px-8 py-6 bg-black/40 border border-white/5 rounded-[32px] text-white placeholder-zinc-700 focus:outline-none focus:border-[#D1FF3D]/30 resize-none font-light italic text-lg shadow-inner"
                      rows={4}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                        Ready for synthesis: {replyText.length} bytes
                      </span>
                      <Button className="bg-[#D1FF3D] hover:bg-white text-black font-black uppercase tracking-widest h-12 px-8 rounded-full shadow-lg shadow-[#D1FF3D]/10">
                        Post Transmission
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-12 space-y-8">
              <div className="bg-[#111111]/40 border border-white/5 rounded-[40px] p-10 backdrop-blur-xl space-y-10">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Signal Metadata</h3>
                  <div className="space-y-4 font-mono text-[10px] uppercase tracking-widest">
                    <div className="flex justify-between items-center group">
                      <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">Detected</span>
                      <span className="text-white">{formatTimeAgo(thread.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">Echoes</span>
                      <span className="text-white">{thread.replies.length}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">Intensity</span>
                      <span className="text-[#D1FF3D]">{thread.likes} AMP</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Origin Node</h3>
                   <UserProfileCard user={thread.author as any} variant="compact" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#9B5CFF]/10 to-transparent border border-[#9B5CFF]/20 rounded-[40px] p-10 backdrop-blur-xl">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4">Frequency Match</h3>
                 <p className="text-[10px] text-zinc-500 font-light leading-relaxed italic mb-8">
                   Identified similar signals within the local Mesh network.
                 </p>
                 <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Link key={i} href={`/community/forum/thread/\${i}`} className="block group">
                         <h4 className="text-xs font-bold text-zinc-400 group-hover:text-[#D1FF3D] transition-all line-clamp-1 mb-1 italic">
                           Hardware modular synthesis vs VST workflows...
                         </h4>
                         <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                            <span>{12 + i} Echoes</span>
                            <span>{150 * i} Sigs</span>
                         </div>
                      </Link>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `\${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `\${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `\${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
