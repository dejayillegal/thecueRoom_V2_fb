
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, ThumbsUp, Award, Sparkles, TrendingUp, Music, Loader2 } from 'lucide-react';
import { UserProfileCard } from '@/components/forum/UserProfileCard';
import { useThreads } from '@/hooks/use-threads';
import { VirtualizedList } from '@/components/VirtualizedList';

interface Category {
  id: string;
  name: string;
  description?: string;
  threadCount: number;
}

interface TopContributor {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  karmaPoints: number;
  badges: string[];
}

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newThread, setNewThread] = useState({ 
    title: '', 
    body: '', 
    categoryId: '', 
  });
  const [prefetchedThreads, setPrefetchedThreads] = useState<Set<string>>(new Set());

  const { data: threads, loading, error, refresh } = useThreads(selectedCategory);

  useEffect(() => {
    fetchCategories();
    fetchTopContributors();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/forum/categories`, { cache: 'no-store' });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('[Forum] Failed to fetch categories:', error);
    }
  };

  const fetchTopContributors = async () => {
    try {
      const response = await fetch(`/api/forum/contributors`, { cache: 'no-store' });
      const data = await response.json();
      setTopContributors(data.contributors || []);
    } catch (error) {
      console.error('[Forum] Failed to fetch contributors:', error);
    }
  };

  const handleCreateThread = async () => {
    try {
      const response = await fetch('/api/forum/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThread),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsCreating(false);
        setNewThread({ title: '', body: '', categoryId: '' });
        refresh();
      }
    } catch (error) {
      console.error('[Forum] Failed to create thread:', error);
    }
  };

  const handleThreadHover = (threadId: string) => {
    if (prefetchedThreads.has(threadId)) return;

    const timeoutId = setTimeout(() => {
      console.log('[Forum] Prefetch thread:', threadId);
      fetch(`/api/forum/thread/${threadId}`, { cache: 'force-cache' });
      setPrefetchedThreads((prev) => new Set(prev).add(threadId));
    }, 150);

    return () => clearTimeout(timeoutId);
  };

  const renderThreadCard = (thread: any) => (
    <Link
      href={`/community/thread/${thread.id}`}
      key={thread.id}
      onMouseEnter={() => handleThreadHover(thread.id)}
      className="block"
    >
      <Card className="bg-[#111111] border-[#1a1a1a] hover:border-[#D1FF3D]/30 transition-all cursor-pointer overflow-hidden group">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-xl mb-2 group-hover:text-[#D1FF3D] transition-colors line-clamp-2">
                {thread.title}
              </h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {thread.body}
              </p>
              {thread.aiSummary && (
                <div className="mt-3 p-3 bg-[#D1FF3D]/5 border border-[#D1FF3D]/20 rounded-lg">
                  <p className="text-xs text-[#D1FF3D]/80 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Summary
                  </p>
                  <p className="text-sm text-gray-300">{thread.aiSummary}</p>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  {thread.replyCount} replies
                </span>
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4" />
                  {thread.likesCount} likes
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  {thread.viewCount} views
                </span>
              </div>
            </div>
            {thread.isPinned && (
              <div className="flex items-center gap-1 px-2 py-1 bg-[#D1FF3D]/10 border border-[#D1FF3D]/30 rounded text-xs text-[#D1FF3D] font-medium ml-4">
                <Award className="w-3 h-3" />
                Pinned
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1a1a1a]">
            <UserProfileCard 
              user={{
                username: thread.username || 'Anonymous',
                displayName: thread.displayName,
                avatar: thread.avatar,
                verified: thread.verified,
              }} 
              variant="inline" 
            />
          </div>
        </div>
      </Card>
    </Link>
  );

  const renderSkeleton = () => (
    <Card className="bg-[#111111] border-[#1a1a1a] p-5 animate-pulse">
      <div className="h-6 bg-[#1a1a1a] rounded w-3/4 mb-3" />
      <div className="h-4 bg-[#1a1a1a] rounded w-full mb-2" />
      <div className="h-4 bg-[#1a1a1a] rounded w-5/6 mb-4" />
      <div className="flex gap-4 mb-4">
        <div className="h-4 bg-[#1a1a1a] rounded w-20" />
        <div className="h-4 bg-[#1a1a1a] rounded w-20" />
        <div className="h-4 bg-[#1a1a1a] rounded w-20" />
      </div>
      <div className="pt-3 border-t border-[#1a1a1a] flex items-center gap-2">
        <div className="w-8 h-8 bg-[#1a1a1a] rounded-full" />
        <div className="h-4 bg-[#1a1a1a] rounded w-24" />
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-[#D1FF3D]" />
              Community Forum 2.0
            </h1>
            <p className="text-gray-400 text-sm">AI-moderated discussion hub for underground artists</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] h-10 px-4 gap-2 font-semibold">
                <Plus className="w-5 h-5" />
                New Thread
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111111] border-[#1a1a1a] text-white max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Create New Thread</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Title</label>
                  <Input
                    value={newThread.title}
                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                    className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                    placeholder="What's your topic?"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Category</label>
                  <Select
                    value={newThread.categoryId}
                    onValueChange={(value) => setNewThread({ ...newThread, categoryId: value })}
                  >
                    <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#1a1a1a]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Content</label>
                  <Textarea
                    value={newThread.body}
                    onChange={(e) => setNewThread({ ...newThread, body: e.target.value })}
                    className="bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[200px]"
                    placeholder="Share your thoughts..."
                  />
                </div>
                <Button 
                  onClick={handleCreateThread}
                  className="w-full bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
                >
                  Create Thread
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Categories */}
          <Card className="lg:col-span-2 bg-[#111111] border-[#1a1a1a] p-4 h-fit sticky top-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-[#D1FF3D]" />
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  !selectedCategory 
                    ? 'bg-[#D1FF3D]/10 text-[#D1FF3D] border border-[#D1FF3D]/30' 
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                All Threads
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-[#D1FF3D]/10 text-[#D1FF3D] border border-[#D1FF3D]/30' 
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-50">{cat.threadCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Main Feed */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <>
                {renderSkeleton()}
                {renderSkeleton()}
                {renderSkeleton()}
              </>
            ) : error ? (
              <Card className="bg-[#111111] border-[#1a1a1a] p-12 text-center">
                <p className="text-red-400 text-lg mb-2">Error loading threads</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </Card>
            ) : threads.length === 0 ? (
              <Card className="bg-[#111111] border-[#1a1a1a] p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">No threads yet</p>
                <p className="text-gray-500 text-sm">Be the first to start a discussion!</p>
              </Card>
            ) : (
              threads.map(renderThreadCard)
            )}
          </div>

          {/* Right Sidebar */}
          <Card className="lg:col-span-3 bg-[#111111] border-[#1a1a1a] p-4 h-fit sticky top-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D1FF3D]" />
              Top Contributors
            </h3>
            <div className="space-y-3">
              {topContributors.slice(0, 5).map((contributor, i) => (
                <div key={contributor.userId} className="flex items-center gap-3 p-2 bg-[#0a0a0a] rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D1FF3D] to-[#9B5CFF] flex items-center justify-center text-black text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {contributor.displayName || contributor.username}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {contributor.karmaPoints} karma
                    </p>
                  </div>
                  {contributor.badges && contributor.badges[0] && (
                    <span className="text-sm">{contributor.badges[0]}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
