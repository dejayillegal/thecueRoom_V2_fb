'use client';

import { useEffect, useState } from 'react';
import { Music, Calendar, ExternalLink } from 'lucide-react';
import { UnifiedEmbedPlayer } from '@/components/Player/UnifiedEmbedPlayer';

interface Playlist {
  id: string;
  title: string;
  description?: string;
  platform: string;
  platformId?: string;
  embedUrl?: string;
  coverImage?: string;
  status: string;
  publishedAt?: string;
  monthOf?: string;
  trackCount: number;
  curatorName: string;
}

export function MonthlyPlaylistWidget() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists/monthly/latest');
      const data = await res.json();

      if (data.ok && data.playlists) {
        setPlaylists(data.playlists);
      } else {
        setError(data.error || 'No playlists available');
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-neutral-800 rounded w-48 mb-4"></div>
        <div className="h-96 bg-neutral-800 rounded"></div>
      </div>
    );
  }

  if (error || playlists.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="text-lime-500" size={24} />
          <h2 className="text-xl font-semibold">Monthly Playlists</h2>
        </div>
        <p className="text-neutral-400">{error || 'No playlists available yet.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {playlists.map((playlist) => (
        <div key={playlist.id} className="bg-neutral-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music className="text-lime-500" size={24} />
              <h2 className="text-xl font-semibold">{playlist.title}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 bg-neutral-800 rounded capitalize text-neutral-300">
                {playlist.platform}
              </span>
              {playlist.monthOf && (
                <div className="flex items-center gap-1 text-sm text-neutral-400">
                  <Calendar size={16} />
                  <span>
                    {new Date(playlist.monthOf).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {playlist.description && (
            <p className="text-neutral-300 mb-4 text-sm">{playlist.description}</p>
          )}

          <div className="mb-4">
            <UnifiedEmbedPlayer
              platform={playlist.platform as 'spotify' | 'soundcloud' | 'mixcloud'}
              playlistId={playlist.platformId || ''}
              embedUrl={playlist.embedUrl || ''}
              title={playlist.title}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-neutral-400">
            <div className="flex items-center gap-4">
              <span>{playlist.trackCount || 0} tracks</span>
              <span>Curated by {playlist.curatorName}</span>
            </div>
            {playlist.embedUrl && (
              <a
                href={playlist.embedUrl.replace('/embed/', '/')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-lime-500 hover:text-lime-400 transition-colors"
              >
                <span>Open in {playlist.platform}</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}