'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Heart,
  Share2,
  UserPlus,
  UserCheck,
  X,
  ExternalLink,
  Settings,
  Edit3,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useFollow } from '@/hooks/useFollow';

interface CurrentUser {
  id: string;
  username: string;
  artistName: string;
  avatar: string;
  bio: string;
  following: number;
  followers: number;
}

interface Artist {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
  followers: number;
  following: number;
}

interface SignalEntry {
  id: string;
  type: 'thread' | 'comment';
  artistName: string;
  username: string;
  avatar: string;
  title: string;
  content: string;
  timestamp: string;
  stats: { replies: number; signals: number };
  isFollowing: boolean;
  isOwn: boolean;
}

function FollowersModal({ 
  isOpen, 
  onClose, 
  title, 
  artists,
  onFollow
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  artists: Artist[];
  onFollow: (username: string, follow: boolean) => void;
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md max-h-[70vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {artists.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No {title.toLowerCase()} yet</p>
          ) : (
            artists.map(artist => (
              <div key={artist.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={artist.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-sm">{artist.displayName}</p>
                    <p className="text-xs text-zinc-500">@{artist.username}</p>
                  </div>
                </div>
                <FollowButton username={artist.username} initialIsFollowing={artist.isFollowing} />
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function FollowButton({ username, initialIsFollowing }: { username: string, initialIsFollowing: boolean }) {
  const { isFollowing, toggleFollow, isLoading } = useFollow(initialIsFollowing, username);
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
      disabled={isLoading}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        isFollowing 
          ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400" 
          : "bg-[#D7FF3C] text-black hover:bg-[#c4eb35]"
      )}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

export default function ArtistSocialClient({ 
  currentUser,
  initialArtists, 
  initialFeed 
}: { 
  currentUser: CurrentUser;
  initialArtists: Artist[], 
  initialFeed: SignalEntry[] 
}) {
  const [artists, setArtists] = useState(initialArtists);
  const [feed] = useState(initialFeed);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(currentUser.followers);
  const [followingCount, setFollowingCount] = useState(currentUser.following);

  useEffect(() => {
    // Listen for follow changes to update counts globally
    const handleFollowChange = (username: string, isFollowing: boolean) => {
      setArtists(prev => prev.map(a => 
        a.username === username 
          ? { ...a, isFollowing, followers: a.followers + (isFollowing ? 1 : -1) }
          : a
      ));
      if (isFollowing) {
        setFollowingCount(prev => prev + 1);
      } else {
        setFollowingCount(prev => prev - 1);
      }
    };

    // Use a custom event to sync state back to the main client
    window.addEventListener('follow-change', ((e: CustomEvent) => {
      handleFollowChange(e.detail.username, e.detail.isFollowing);
    }) as EventListener);

    return () => {
      window.removeEventListener('follow-change', ((e: CustomEvent) => {
        handleFollowChange(e.detail.username, e.detail.isFollowing);
      }) as EventListener);
    };
  }, []);

  const navigateToThread = (threadId: string) => {
    window.location.href = `/forum/thread/${threadId}`;
  };

  const navigateToArtist = (username: string) => {
    window.location.href = `/link/${username}`;
  };

  const filteredFeed = activeTab === 'following' 
    ? feed.filter(f => f.isFollowing || f.isOwn)
    : feed;

  const suggestedArtists = artists.filter(a => !a.isFollowing && a.username !== currentUser.username).slice(0, 5);
  const followingArtists = artists.filter(a => a.isFollowing);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <img 
                src={currentUser.avatar} 
                alt="" 
                className="w-20 h-20 rounded-full border-2 border-[#D7FF3C] object-cover"
              />
              <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B0B0B]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{currentUser.artistName}</h1>
              <p className="text-zinc-500 text-sm mb-3">@{currentUser.username}</p>
              <div className="flex items-center gap-6 text-sm">
                <button 
                  onClick={() => setShowFollowers(true)}
                  className="hover:underline"
                >
                  <span className="font-semibold">{followersCount}</span>
                  <span className="text-zinc-500 ml-1">followers</span>
                </button>
                <button 
                  onClick={() => setShowFollowing(true)}
                  className="hover:underline"
                >
                  <span className="font-semibold">{followingCount}</span>
                  <span className="text-zinc-500 ml-1">following</span>
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <a 
                href="/settings" 
                className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
              >
                <Edit3 size={18} />
              </a>
              <a 
                href={`/bio/${currentUser.username}`}
                target="_blank"
                className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
              >
                <LinkIcon size={18} />
              </a>
            </div>
          </div>
          {currentUser.bio && (
            <p className="text-zinc-400 text-sm mb-4">{currentUser.bio}</p>
          )}
        </motion.header>

        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('foryou')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'foryou' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            For You
            {activeTab === 'foryou' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D7FF3C]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'following' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Following
            {activeTab === 'following' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D7FF3C]" />
            )}
          </button>
        </div>

        {suggestedArtists.length > 0 && activeTab === 'foryou' && (
          <div className="mb-6 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Suggested for you</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {suggestedArtists.map((artist, i) => (
                <div key={artist.id} className="flex-shrink-0 w-28 text-center">
                  <img 
                    src={artist.avatar} 
                    alt="" 
                    className="w-16 h-16 rounded-full mx-auto mb-2 cursor-pointer hover:ring-2 ring-[#D7FF3C] transition-all"
                    onClick={() => navigateToArtist(artist.username)}
                  />
                  <p className="text-xs font-medium truncate mb-1">{artist.displayName}</p>
                  <FollowButton username={artist.username} initialIsFollowing={artist.isFollowing} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-0">
          <AnimatePresence mode="popLayout">
            {filteredFeed.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-zinc-500"
              >
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No posts yet. Follow artists to see their content here.</p>
              </motion.div>
            ) : (
              filteredFeed.map((signal, i) => (
                <motion.article
                  key={signal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className="py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigateToThread(signal.id)}
                >
                  <div className="flex gap-3">
                    <img 
                      src={signal.avatar} 
                      alt="" 
                      className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 ring-white/20 transition-all"
                      onClick={(e) => { e.stopPropagation(); navigateToArtist(signal.username); }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-semibold text-sm hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); navigateToArtist(signal.username); }}
                        >
                          {signal.artistName}
                        </span>
                        <span className="text-zinc-500 text-sm">@{signal.username}</span>
                        <span className="text-zinc-600 text-xs">· {signal.timestamp}</span>
                        {signal.isOwn && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#D7FF3C]/20 text-[#D7FF3C] rounded">You</span>
                        )}
                      </div>
                      <h3 className="font-medium mb-1 text-white">{signal.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">{signal.content}</p>
                      <div className="flex items-center gap-6 mt-3">
                        <button 
                          className="flex items-center gap-1.5 text-zinc-500 hover:text-[#D7FF3C] transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare size={16} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs">{signal.stats.replies}</span>
                        </button>
                        <button 
                          className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Heart size={16} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs">{signal.stats.signals}</span>
                        </button>
                        <button 
                          className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Share2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showFollowers && (
          <FollowersModal 
            isOpen={showFollowers} 
            onClose={() => setShowFollowers(false)}
            title="Followers"
            artists={artists.filter(a => {
              const isFollowingMe = initialArtists.find(ia => ia.username === a.username)?.isFollowing;
              return isFollowingMe;
            })}
            onFollow={() => {}} // Not used
          />
        )}
        {showFollowing && (
          <FollowersModal 
            isOpen={showFollowing} 
            onClose={() => setShowFollowing(false)}
            title="Following"
            artists={followingArtists}
            onFollow={() => {}} // Not used
          />
        )}
      </AnimatePresence>
    </div>
  );
}
