'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Heart,
  Share2,
  X,
  Edit3,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { useFollow } from '@/hooks/useFollow';
import { getArtistProfileHref } from '@/lib/routing/getArtistProfileHref';
import { resolveAvatar } from '@/lib/avatar/avatarResolver';
import { useCurrentProfile } from '@/lib/identity/useCurrentProfile';

interface CurrentUser {
  id: string;
  username: string;
  artistName: string;
  profile: any;
  bio: string;
  following: number;
  followers: number;
}

interface Artist {
  id: string;
  username: string;
  displayName: string;
  profile: any;
  bio: string;
  isFollowing: boolean;
  followers: number;
  following: number;
  lastActive?: string | Date;
}

interface SignalEntry {
  id: string;
  type: 'thread' | 'comment';
  artistName: string;
  username: string;
  profile: any;
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
  artists
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  artists: Artist[];
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        style={{ position: 'absolute', inset: 0 }} 
        onClick={onClose} 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: 'relative',
          backgroundColor: '#111',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '28rem',
          maxHeight: '70vh',
          overflow: 'hidden',
          zIndex: 1
        }}
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
                    <div className="relative">
                      <img 
                        src={resolveAvatar(artist.profile)}
                        alt={artist.username}
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                      {artist.lastActive && (Date.now() - new Date(artist.lastActive).getTime() < 2 * 60 * 1000) && (
                        <span className="presence-dot" />
                      )}
                    </div>
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
    </div>
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
  currentUser: initialCurrentUser,
  initialArtists, 
  initialFeed 
}: { 
  currentUser: CurrentUser;
  initialArtists: Artist[], 
  initialFeed: SignalEntry[] 
}) {
  const { profile: liveProfile, loading: profileLoading } = useCurrentProfile();
  const [artists, setArtists] = useState(initialArtists);
  const [feed] = useState(initialFeed);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(initialCurrentUser.following);

  const currentUser = liveProfile ? {
    ...initialCurrentUser,
    artistName: liveProfile.artistName || initialCurrentUser.artistName,
    username: liveProfile.username || initialCurrentUser.username,
    profile: liveProfile.profile || initialCurrentUser.profile,
    bio: liveProfile.profile?.bio || initialCurrentUser.bio
  } : initialCurrentUser;

  useEffect(() => {
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

    const followListener = (e: any) => {
      handleFollowChange(e.detail.username, e.detail.isFollowing);
    };

    window.addEventListener('follow-change', followListener as EventListener);
    return () => window.removeEventListener('follow-change', followListener as EventListener);
  }, []);

  const navigateToThread = (threadId: string) => {
    window.location.href = `/forum/thread/${threadId}`;
  };

  const navigateToArtist = (idOrUsername: string) => {
    window.location.href = getArtistProfileHref(idOrUsername);
  };

  const filteredFeed = activeTab === 'following' 
    ? feed.filter(f => f.isFollowing || f.isOwn)
    : feed;

  const suggestedArtists = artists.filter(a => !a.isFollowing && a.username !== currentUser.username).slice(0, 5);
  const followingArtists = artists.filter(a => a.isFollowing);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <style jsx global>{`
        .presence-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: #A3FF12;
          border-radius: 50%;
        }
      `}</style>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem', display: 'block' }}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <img 
                src={resolveAvatar(currentUser.profile)}
                alt={currentUser.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{currentUser.artistName}</h1>
              <p className="text-zinc-500 text-sm mb-3">@{currentUser.username}</p>
              <div className="flex items-center gap-6 text-sm">
                <button 
                  onClick={() => setShowFollowers(true)}
                  className="hover:underline"
                >
                  <span className="font-semibold">{currentUser.followers}</span>
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
              <Link 
                href={`/bio/${currentUser.username}`}
                target="_blank"
                prefetch={false}
                className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
              >
                <LinkIcon size={18} />
              </Link>
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
              <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#D7FF3C', display: 'block' }} />
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
              <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#D7FF3C', display: 'block' }} />
            )}
          </button>
        </div>

        {suggestedArtists.length > 0 && activeTab === 'foryou' && (
          <div className="mb-6 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Suggested for you</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {suggestedArtists.map((artist) => (
                <div key={artist.id} className="flex-shrink-0 w-28 text-center">
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigateToArtist(artist.username)}
                  >
                    <div className="relative inline-block">
                      <img 
                        src={resolveAvatar(artist.profile)}
                        alt={artist.username}
                        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                      />
                      {artist.lastActive && (Date.now() - new Date(artist.lastActive).getTime() < 2 * 60 * 1000) && (
                        <span className="presence-dot" />
                      )}
                    </div>
                  </div>
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
                style={{ textAlign: 'center', padding: '3rem 0', color: '#71717a', display: 'block' }}
              >
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No posts yet. Follow artists to see their content here.</p>
              </motion.div>
            ) : (
              filteredFeed.map((signal, i) => {
                const isActive = signal.profile?.lastActivity && (Date.now() - new Date(signal.profile.lastActivity).getTime() < 2 * 60 * 1000);
                return (
                  <article
                    key={signal.id}
                    style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ display: 'flex', gap: '0.75rem' }}
                    >
                      <div 
                        className="flex gap-3 w-full"
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigateToArtist(signal.username); }}
                        >
                          <div className="relative">
                            <img 
                              src={resolveAvatar(signal.profile)}
                              alt={signal.username}
                              className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                            />
                            {isActive && <span className="presence-dot" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => navigateToThread(signal.id)}>
                          <div className="flex items-center gap-2 mb-1">
                            <Link 
                              href={getArtistProfileHref(signal.username)}
                              className="font-semibold text-sm hover:underline cursor-pointer hover:text-[#D1FF3D] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {signal.artistName}
                            </Link>
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
                    </motion.div>
                  </article>
                );
              })
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
              const isFollowingMe = initialArtists.find((ia: Artist) => ia.username === a.username)?.isFollowing;
              return !!isFollowingMe;
            })}
          />
        )}
        {showFollowing && (
          <FollowersModal 
            isOpen={showFollowing} 
            onClose={() => setShowFollowing(false)}
            title="Following"
            artists={followingArtists}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
