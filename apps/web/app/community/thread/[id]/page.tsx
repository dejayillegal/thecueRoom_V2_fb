
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, ThumbsUp, Award, Sparkles, TrendingUp, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { UserProfileCard } from '@/components/forum/UserProfileCard';
import { useThread } from '@/hooks/use-thread';
import { VirtualizedList } from '@/components/VirtualizedList';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  const [replyBody, setReplyBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { thread, replies, loading, error, postReply, toggleLike } = useThread(threadId);

  const handlePostReply = async () => {
    if (!replyBody.trim()) return;

    setIsSubmitting(true);
    try {
      await postReply(replyBody);
      setReplyBody('');
    } catch (error) {
      console.error('[Forum] Failed to post reply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to post reply';
      
      if (errorMessage.includes('timeout')) {
        alert('Request timed out. The server might be busy. Please try again.');
      } else if (errorMessage.includes('Unauthorized')) {
        alert('Please sign in to post a reply.');
      } else {
        alert('Failed to post reply. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReply = (reply: any) => (
    <Card
      key={reply.id}
      className={`bg-[#111111] border-[#1a1a1a] p-4 ${
        reply.status === 'pending' ? 'opacity-50' : ''
      } ${reply.status === 'review' ? 'border-yellow-500/30' : ''}`}
    >
      <UserProfileCard
        user={{
          username: reply.username || 'Anonymous',
          displayName: reply.displayName,
          avatar: reply.avatar,
        }}
        variant="inline"
      />
      <p className="text-gray-300 text-sm mt-3 whitespace-pre-wrap">{reply.body}</p>
      {reply.status === 'review' && (
        <p className="text-yellow-500 text-xs mt-2">Under review by AI moderation</p>
      )}
      {reply.status === 'pending' && (
        <p className="text-gray-500 text-xs mt-2">Posting...</p>
      )}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="w-4 h-4" />
          {reply.likesCount}
        </span>
        <span className="text-xs">
          {new Date(reply.createdAt).toLocaleDateString()} at {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D1FF3D] animate-spin" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="bg-[#111111] border-[#1a1a1a] p-12 text-center">
          <p className="text-red-400 text-lg mb-2">Error loading thread</p>
          <p className="text-gray-500 text-sm">{error || 'Thread not found'}</p>
          <Button
            onClick={() => router.push('/community/forum')}
            className="mt-4 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
          >
            Back to Forum
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <Link
          href="/community/forum"
          className="inline-flex items-center gap-2 text-[#D1FF3D] hover:text-[#e7ff6f] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </Link>

        {/* Thread Card */}
        <Card className="bg-[#111111] border-[#1a1a1a] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex-1">{thread.title}</h1>
            {thread.isPinned && (
              <div className="flex items-center gap-1 px-3 py-1 bg-[#D1FF3D]/10 border border-[#D1FF3D]/30 rounded text-sm text-[#D1FF3D] font-medium">
                <Award className="w-4 h-4" />
                Pinned
              </div>
            )}
          </div>

          <UserProfileCard
            user={{
              username: thread.username || 'Anonymous',
              displayName: thread.displayName,
              avatar: thread.avatar,
              verified: thread.verified,
            }}
            variant="compact"
          />

          <p className="text-gray-300 text-base mt-4 whitespace-pre-wrap">{thread.body}</p>

          {thread.aiSummary && (
            <div className="mt-4 p-4 bg-[#D1FF3D]/5 border border-[#D1FF3D]/20 rounded-lg">
              <p className="text-sm text-[#D1FF3D]/80 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                AI Summary
              </p>
              <p className="text-sm text-gray-300">{thread.aiSummary}</p>
            </div>
          )}

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#1a1a1a]">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                thread.liked
                  ? 'bg-[#D1FF3D]/10 text-[#D1FF3D] border border-[#D1FF3D]/30'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${thread.liked ? 'fill-current' : ''}`} />
              {thread.likesCount}
            </button>
            <span className="flex items-center gap-2 text-gray-500">
              <MessageSquare className="w-5 h-5" />
              {thread.replyCount} replies
            </span>
            <span className="flex items-center gap-2 text-gray-500">
              <TrendingUp className="w-5 h-5" />
              {thread.viewCount} views
            </span>
          </div>
        </Card>

        {/* Reply Composer */}
        <Card className="bg-[#111111] border-[#1a1a1a] p-6 mb-6">
          <h3 className="text-white font-semibold mb-3">Post a Reply</h3>
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            className="bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[120px] mb-3"
            placeholder="Share your thoughts..."
            disabled={isSubmitting}
          />
          <Button
            onClick={handlePostReply}
            disabled={isSubmitting || !replyBody.trim()}
            className="bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post Reply
          </Button>
        </Card>

        {/* Replies */}
        <div>
          <h3 className="text-white font-semibold mb-4">
            Replies ({replies.length})
          </h3>
          <div className="space-y-4">
            {replies.length === 0 ? (
              <Card className="bg-[#111111] border-[#1a1a1a] p-8 text-center">
                <p className="text-gray-400">No replies yet. Be the first to reply!</p>
              </Card>
            ) : (
              replies.map(renderReply)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
