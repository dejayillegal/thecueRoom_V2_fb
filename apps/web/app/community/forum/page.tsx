
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, ThumbsUp, Award, Sparkles, TrendingUp, Music, Flag } from 'lucide-react';
import { UserProfileCard } from '@/components/forum/UserProfileCard';

interface Thread {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  userId: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  verified?: boolean;
  replyCount: number;
  likesCount: number;
  viewCount: number;
  isPinned: boolean;
  aiSummary?: string;
  embedLinks?: string[];
  createdAt: string;
  updatedAt: string;
}

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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newThread, setNewThread] = useState({ 
    title: '', 
    body: '', 
    categoryId: '', 
    embedLinks: [] as string[] 
  });
  const [aiAssist, setAiAssist] = useState<string>('');

  useEffect(() => {
    fetchCategories();
    fetchThreads();
    fetchTopContributors();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchThreads = async () => {
    try {
      const url = selectedCategory 
        ? `/api/forum/thread?categoryId=${selectedCategory}&limit=50`
        : '/api/forum/thread?limit=50';
      const response = await fetch(url);
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const fetchTopContributors = async () => {
    try {
      const response = await fetch('/api/forum/contributors');
      const data = await response.json();
      setTopContributors(data.contributors || []);
    } catch (error) {
      console.error('Failed to fetch contributors:', error);
    }
  };

  const handleAIAssist = async () => {
    try {
      const response = await fetch('/api/forum/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newThread.title, 
          body: newThread.body 
        }),
      });
      const data = await response.json();
      setAiAssist(data.suggestion || '');
    } catch (error) {
      console.error('AI assist failed:', error);
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
        if (data.status === 'pending') {
          alert('Thread submitted for moderation review');
        } else if (data.status === 'rejected') {
          alert('Thread rejected by AI moderation. Please revise your content.');
          return;
        }
        
        setIsCreating(false);
        setNewThread({ title: '', body: '', categoryId: '', embedLinks: [] });
        fetchThreads();
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

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
                    placeholder="Share your thoughts... (Markdown supported)"
                  />
                </div>
                {aiAssist && (
                  <div className="p-3 bg-[#D1FF3D]/10 border border-[#D1FF3D]/30 rounded-lg">
                    <p className="text-sm text-[#D1FF3D]">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      AI Suggestion: {aiAssist}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAIAssist}
                    variant="outline"
                    className="flex-1 border-[#D1FF3D]/30 text-[#D1FF3D] hover:bg-[#D1FF3D]/10"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Assistant
                  </Button>
                  <Button 
                    onClick={handleCreateThread}
                    className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
                  >
                    Create Thread
                  </Button>
                </div>
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
            {threads.length === 0 ? (
              <Card className="bg-[#111111] border-[#1a1a1a] p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">No threads yet</p>
                <p className="text-gray-500 text-sm">Be the first to start a discussion!</p>
              </Card>
            ) : (
              threads.map((thread) => (
                <Card 
                  key={thread.id} 
                  className="bg-[#111111] border-[#1a1a1a] hover:border-[#D1FF3D]/30 transition-all cursor-pointer overflow-hidden group"
                >
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
              ))
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D1FF3D] to-[#9B5CFF] flex items-center justify-center text-black text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {contributor.displayName || contributor.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contributor.karmaPoints} karma
                    </p>
                  </div>
                  {contributor.badges && contributor.badges[0] && (
                    <span className="text-lg">{contributor.badges[0]}</span>
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
