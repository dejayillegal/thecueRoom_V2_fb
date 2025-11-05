'use client';

import { useEffect, useState } from 'react';
import { Music, ExternalLink, Plus } from 'lucide-react';
import { EmbedPlayer } from '@/components/NowPlaying/EmbedPlayer';

interface Playlist {
  id: string;
  title: string;
  description?: string;
  platform: string;
  platformId?: string;
  embedUrl?: string;
  thumbnail?: string;
  curatedAt?: string;
  curatorName?: string;
  status: string;
}

interface LatestPlaylistWidgetProps {
  userRole?: string;
  onSuggestTrack?: () => void;
}

export function LatestPlaylistWidget({ userRole, onSuggestTrack }: LatestPlaylistWidgetProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestPlaylist() {
      try {
        const res = await fetch('/api/playlists/latest');
        if (!res.ok) throw new Error('Failed to fetch playlist');
        
        const data = await res.json();
        if (data.ok && data.playlist) {
          setPlaylist({
            id: data.playlist.id,
            title: data.playlist.title,
            description: data.playlist.description,
            platform: data.playlist.platform,
            platformId: data.playlist.platformId,
            embedUrl: data.playlist.embedUrl,
            thumbnail: data.playlist.coverImage,
            curatedAt: data.playlist.publishedAt,
            curatorName: data.playlist.curatorName,
            status: data.playlist.status,
          });
        }
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    }

    fetchLatestPlaylist();
  }, []);

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-neutral-800 rounded w-48 mb-4"></div>
        <div className="h-96 bg-neutral-800 rounded"></div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="text-lime-500" size={24} />
          <h2 className="text-xl font-semibold">Latest Playlist</h2>
        </div>
        <p className="text-neutral-400">{error || 'No playlists available yet.'}</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="text-lime-500" size={24} />
          <h2 className="text-xl font-semibold">{playlist.title}</h2>
        </div>
        {playlist.curatedAt && (
          <span className="text-sm text-neutral-400">
            {new Date(playlist.curatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        )}
      </div>

      {playlist.description && (
        <p className="text-neutral-300 mb-4 text-sm">{playlist.description}</p>
      )}

      <EmbedPlayer
        platform={playlist.platform}
        platformId={playlist.platformId}
        embedUrl={playlist.embedUrl}
        title={playlist.title}
        className="mb-4"
        height={400}
      />

      <div className="flex gap-3">
        {userRole === 'artist' && onSuggestTrack && (
          <button
            onClick={onSuggestTrack}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
          >
            <Plus size={18} />
            Suggest a Track
          </button>
        )}
        {playlist.embedUrl && (
          <a
            href={playlist.embedUrl.replace('/embed/', '/')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-black rounded-md transition-colors font-medium"
          >
            <ExternalLink size={18} />
            Open Playlist
          </a>
        )}
      </div>

      {playlist.curatorName && (
        <p className="text-xs text-neutral-500 mt-4 text-center">
          Curated by {playlist.curatorName}
        </p>
      )}
    </div>
  );
}
