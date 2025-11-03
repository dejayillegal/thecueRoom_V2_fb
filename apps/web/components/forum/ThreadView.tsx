'use client';

import { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Flag, Eye, Clock, Pin, Lock, CheckCircle2, ArrowLeft, Bookmark, Bell } from 'lucide-react';
import Link from 'next/link';
import { UserProfileCard } from './UserProfileCard';
import { Button } from '@/components/ui/button';

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
  title: 'What\'s the best synth for a beginner under $500?',
  body: 'I\'ve been producing music in the box for the past year and I\'m ready to get my first hardware synthesizer. My budget is around $500 and I\'m interested in both FM and subtractive synthesis.\n\nI\'ve been looking at:\n- Korg Minilogue XD\n- Arturia MicroFreak\n- Behringer DeepMind 6\n\nWhich one would you recommend for someone who wants to learn synthesis fundamentals while still being able to create professional-sounding patches? Also open to other suggestions!',
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
      body: 'I started with the Minilogue XD and it\'s absolutely fantastic for learning. The interface is super intuitive and the sound quality is professional-grade. Plus, you get both analog and digital oscillators which gives you a lot of versatility.',
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <Link
          href="/community/forum"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#D7FF3C] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </Link>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
              <div className="p-6 border-b border-[#1a1a1a]">
                <div className="flex items-start gap-3 mb-4">
                  {thread.isPinned && (
                    <Pin className="w-5 h-5 text-[#D7FF3C] flex-shrink-0 mt-1" />
                  )}
                  <h1 className="text-2xl font-bold text-white flex-1">
                    {thread.title}
                  </h1>
                  {thread.isLocked && (
                    <Lock className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="px-2 py-1 bg-[#1a1a1a] text-[#9B5CFF] rounded text-xs font-medium">
                    {thread.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{thread.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeAgo(thread.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-lg font-bold relative">
                      {thread.author.displayName[0]}
                      {thread.author.verified && (
                        <CheckCircle2 className="absolute -bottom-1 -right-1 w-4 h-4 text-green-500 bg-[#0a0a0a] rounded-full" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">
                        {thread.author.displayName}
                      </h3>
                      {thread.author.verified && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded font-medium">
                          VERIFIED ARTIST
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">@{thread.author.username}</p>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {thread.body}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded-full hover:border-[#D7FF3C] hover:text-[#D7FF3C] transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#1a1a1a]">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${isLiked
                        ? 'bg-[#D7FF3C]/10 text-[#D7FF3C] border border-[#D7FF3C]/30'
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                      }
                    `}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {thread.likes + (isLiked ? 1 : 0)}
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg font-medium text-sm transition-all">
                    <MessageSquare className="w-4 h-4" />
                    Reply
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg font-medium text-sm transition-all">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg font-medium text-sm transition-all ml-auto">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>

              <div className="border-t border-[#1a1a1a]">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {thread.replies.length} Replies
                  </h3>

                  <div className="space-y-6">
                    {thread.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-sm font-bold relative">
                            {reply.author.displayName[0]}
                            {reply.author.verified && (
                              <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 bg-[#0a0a0a] rounded-full" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-white">
                              {reply.author.displayName}
                            </h4>
                            {reply.author.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(reply.createdAt)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-300 mb-3">
                            {reply.body}
                          </p>

                          <div className="flex items-center gap-3">
                            <button className={`
                              flex items-center gap-1.5 text-xs font-medium transition-colors
                              ${reply.isLiked ? 'text-[#D7FF3C]' : 'text-gray-400 hover:text-gray-300'}
                            `}>
                              <ThumbsUp className={`w-3.5 h-3.5 ${reply.isLiked ? 'fill-current' : ''}`} />
                              {reply.likes}
                            </button>
                            <button className="text-xs text-gray-400 hover:text-gray-300 font-medium transition-colors">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!thread.isLocked && (
                    <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
                      <h4 className="text-sm font-semibold text-white mb-3">Post a Reply</h4>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="w-full px-4 py-3 bg-[#111111] border border-[#1a1a1a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D7FF3C] resize-none"
                        rows={4}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {replyText.length} / 10,000 characters
                        </span>
                        <Button className="bg-[#D7FF3C] hover:bg-[#e7ff6f] text-black font-semibold">
                          Post Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                  Thread Info
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-white">{formatTimeAgo(thread.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Replies</span>
                    <span className="text-white">{thread.replies.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Views</span>
                    <span className="text-white">{thread.views}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Likes</span>
                    <span className="text-white">{thread.likes}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#1a1a1a] space-y-2">
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`
                      w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${isBookmarked
                        ? 'bg-[#D7FF3C]/10 text-[#D7FF3C] border border-[#D7FF3C]/30'
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
                      }
                    `}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>

                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`
                      w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${isFollowing
                        ? 'bg-[#9B5CFF]/10 text-[#9B5CFF] border border-[#9B5CFF]/30'
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
                      }
                    `}
                  >
                    <Bell className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow Thread'}
                  </button>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                  Thread Author
                </h3>
                <UserProfileCard user={thread.author} variant="compact" />
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                  Similar Threads
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Link
                      key={i}
                      href={`/community/forum/thread/${i}`}
                      className="block hover:bg-[#111111] rounded p-2 -mx-2 transition-colors"
                    >
                      <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">
                        Another thread about synthesizers
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{12 + i} replies</span>
                        <span>•</span>
                        <span>{150 * i} views</span>
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
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}