'use client';

import { useFollow } from '@/hooks/useFollow';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Zap, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';

interface ArtistPreviewCardProps {
  username: string;
  displayName: string;
  avatar: string;
  verified?: boolean;
  bio?: string;
  stats?: {
    signals?: number;
    replies?: number;
  };
  isFollowing?: boolean;
  onFollow?: () => void;
  position?: { x: number; y: number };
  onClose?: () => void;
}

export function ArtistPreviewCard({
  username,
  displayName,
  avatar,
  verified,
  bio,
  stats,
  isFollowing: initialIsFollowing = false,
  onFollow,
  position,
  onClose,
}: ArtistPreviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isFollowing: following, toggleFollow: handleFollow, isLoading } = useFollow(initialIsFollowing, username);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const style = position ? {
    position: 'fixed' as const,
    left: position.x,
    top: position.y,
    zIndex: 9999,
  } : {};

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.15 }}
      style={style}
      className="w-72 bg-[#111111] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Link href={`/artist/u/${username}`} className="flex-shrink-0">
            <div className="w-14 h-14 bg-zinc-800 border border-white/10 overflow-hidden hover:border-[#D1FF3D]/50 transition-colors">
              <img src={avatar} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/artist/u/${username}`}>
              <h3 className="text-sm font-bold uppercase tracking-tight hover:text-[#D1FF3D] transition-colors truncate">
                {displayName}
              </h3>
            </Link>
            <p className="text-[10px] font-mono text-zinc-500 lowercase">@{username}</p>
            {verified && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#D1FF3D]/10 text-[8px] uppercase tracking-wider text-[#D1FF3D]">
                Verified
              </span>
            )}
          </div>
        </div>

        {bio && (
          <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">{bio}</p>
        )}

        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-[#D1FF3D]" />
            <span>{stats?.signals || 0} signals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={12} />
            <span>{stats?.replies || 0} replies</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFollow(); onFollow?.(); }}
          disabled={isLoading}
          className={`w-full py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
            following
              ? 'bg-zinc-800 border border-white/10 text-zinc-400 hover:bg-red-900/20 hover:border-red-500/30 hover:text-red-400'
              : 'bg-[#D1FF3D] text-black hover:bg-[#c5ea35]'
          }`}
        >
          {following ? <UserMinus size={14} /> : <UserPlus size={14} />}
          {isLoading ? 'Loading...' : following ? 'Unfollow' : 'Follow'}
        </button>
      </div>
    </motion.div>
  );
}

export function useArtistPreview() {
  const [previewData, setPreviewData] = useState<{
    username: string;
    displayName: string;
    avatar: string;
    verified?: boolean;
    bio?: string;
    stats?: { signals?: number; replies?: number };
    position: { x: number; y: number };
  } | null>(null);

  const showPreview = (
    event: React.MouseEvent,
    data: Omit<typeof previewData, 'position'> & { position?: { x: number; y: number } }
  ) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPreviewData({
      ...data,
      position: data.position || { x: rect.left, y: rect.bottom + 8 },
    } as any);
  };

  const hidePreview = () => setPreviewData(null);

  return { previewData, showPreview, hidePreview };
}
