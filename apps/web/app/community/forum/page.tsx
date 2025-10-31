
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageSquare, ThumbsUp, Award, Send } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  categoryId: string;
  userId: string;
  userName: string;
  replyCount: number;
  upvotes: number;
  isPinned: boolean;
  createdAt: string;
}

export default function ForumPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', categoryId: 'general' });

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/forum/threads');
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const handleCreateThread = async () => {
    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThread),
      });

      if (response.ok) {
        setIsCreating(false);
        setNewThread({ title: '', content: '', categoryId: 'general' });
        fetchThreads();
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Community Forum</h1>
            <p className="text-gray-400 text-sm">Invite-only artist community</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] h-9 px-3 gap-1.5">
                <Plus className="w-4 h-4" />
                <span>New Thread</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111111] border-[#1a1a1a] text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Thread</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Title</label>
                  <Input
                    value={newThread.title}
                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                    className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Content</label>
                  <Textarea
                    value={newThread.content}
                    onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                    className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[120px]"
                  />
                </div>
                <Button onClick={handleCreateThread} className="w-full bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] h-9 gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Create Thread</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <Card className="bg-[#111111] border-[#1a1a1a] p-4 h-fit">
            <h3 className="text-white font-semibold mb-3">Categories</h3>
            <div className="space-y-2">
              {['General', 'Production', 'Events', 'Feedback'].map((cat) => (
                <button
                  key={cat}
                  className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card>

          {/* Thread List */}
          <div className="lg:col-span-2 space-y-3">
            {threads.map((thread) => (
              <Card key={thread.id} className="bg-[#111111] border-[#1a1a1a] p-4 hover:border-[#333333] transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{thread.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{thread.userName}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {thread.replyCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {thread.upvotes}
                      </span>
                    </div>
                  </div>
                  {thread.isPinned && <Award className="w-4 h-4 text-[#D1FF3D]" />}
                </div>
              </Card>
            ))}
          </div>

          {/* Right Sidebar */}
          <Card className="bg-[#111111] border-[#1a1a1a] p-4 h-fit">
            <h3 className="text-white font-semibold mb-3">Top Contributors</h3>
            <div className="space-y-2">
              {['Artist1', 'Producer2', 'DJ3'].map((name, i) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D1FF3D] flex items-center justify-center text-black text-xs font-bold">
                    {name[0]}
                  </div>
                  <span className="text-sm text-gray-400">{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
