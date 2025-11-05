'use client';

import { useEffect, useState } from 'react';
import { Music, Calendar, Plus } from 'lucide-react';
import { UnifiedEmbedPlayer } from '@/components/Player/UnifiedEmbedPlayer';

interface MonthlyPlaylist {
  id: string;
  title: string;
  description?: string;
  platform: 'spotify' | 'soundcloud' | 'mixcloud';
  platformId?: string;
  embedUrl?: string;
  coverImage?: string;
  monthOf?: string;
  publishedAt?: string;
  trackCount?: number;
  status: string;
  autoCurated?: boolean;
  curatorName?: string;
}

interface MonthlyPlaylistWidgetProps {
  userRole?: string;
  onSuggestTrack?: () => void;
}

export function MonthlyPlaylistWidget({ userRole, onSuggestTrack }: MonthlyPlaylistWidgetProps) {
  const [playlist, setPlaylist] = useState<MonthlyPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestMonthlyPlaylist() {
      try {
        const res = await fetch('/api/playlists/monthly/latest');
        if (!res.ok) throw new Error('Failed to fetch monthly playlist');

        const data = await res.json();
        if (data.ok && data.playlist) {
          setPlaylist(data.playlist);
        } else if (data.ok && !data.playlist) {
          setError(data.message || 'No monthly playlist available yet.');
        }
      } catch (err) {
        console.error('Error fetching monthly playlist:', err);
        setError('Failed to load monthly playlist');
      } finally {
        setLoading(false);
      }
    }

    fetchLatestMonthlyPlaylist();
  }, []);

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-neutral-800 rounded w-64 mb-4"></div>
        <div className="h-96 bg-neutral-800 rounded"></div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="text-lime-500" size={24} />
          <h2 className="text-xl font-semibold">Monthly Curated Music</h2>
        </div>
        <p className="text-neutral-400">{error || 'No monthly playlists available yet.'}</p>
        {userRole === 'admin' && (
          <p className="text-sm text-neutral-500 mt-2">
            Head to the admin panel to create your first monthly playlist.
          </p>
        )}
      </div>
    );
  }

  const monthDisplay = playlist.monthOf
    ? new Date(playlist.monthOf).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-neutral-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="text-lime-500" size={24} />
          <div>
            <h2 className="text-xl font-semibold">{playlist.title}</h2>
            {monthDisplay && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="text-neutral-500" size={14} />
                <span className="text-xs text-neutral-500">{monthDisplay}</span>
              </div>
            )}
          </div>
        </div>
        {playlist.autoCurated && (
          <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded-full border border-purple-700/50">
            AI Curated
          </span>
        )}
      </div>

      {playlist.description && (
        <p className="text-neutral-300 mb-4 text-sm">{playlist.description}</p>
      )}

      <UnifiedEmbedPlayer
        platform={playlist.platform}
        playlistId={playlist.platformId}
        embedUrl={playlist.embedUrl}
        title={playlist.title}
        coverImage={playlist.coverImage}
        trackCount={playlist.trackCount}
        className="mb-4"
        height={400}
        showExternalButton={true}
      />

      {userRole === 'artist' && onSuggestTrack && (
        <button
          onClick={onSuggestTrack}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors mt-3"
        >
          <Plus size={18} />
          Suggest a Track for Next Month
        </button>
      )}

      {playlist.curatorName && (
        <p className="text-xs text-neutral-500 mt-4 text-center">
          {playlist.autoCurated ? 'AI-curated by' : 'Curated by'} {playlist.curatorName}
        </p>
      )}
    </div>
  );
}
