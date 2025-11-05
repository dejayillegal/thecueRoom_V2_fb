
'use client';

import { useState, useEffect } from 'react';
import { MonthlyPlaylistWidget } from '@/components/Dashboard/MonthlyPlaylistWidget';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function MonthlyMusicPage() {
  const [pastPlaylists, setPastPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPastPlaylists() {
      try {
        const res = await fetch('/api/admin/monthly-playlists/list?status=archived&limit=6');
        const data = await res.json();
        if (data.ok) {
          setPastPlaylists(data.playlists || []);
        }
      } catch (error) {
        console.error('Failed to fetch past playlists:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPastPlaylists();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Monthly Curated Music</h1>
          <p className="text-neutral-400">Discover our monthly curated playlists</p>
        </div>

        {/* Current Monthly Playlist */}
        <div className="mb-8">
          <MonthlyPlaylistWidget userRole="user" />
        </div>

        {/* Past Playlists */}
        {!loading && pastPlaylists.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Past Monthly Playlists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastPlaylists.map((playlist: any) => (
                <Card key={playlist.id} className="bg-neutral-900 border-neutral-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-lime-500" size={16} />
                    <span className="text-sm text-neutral-400">
                      {new Date(playlist.monthOf).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-white font-medium mb-2">{playlist.title}</h3>
                  {playlist.description && (
                    <p className="text-sm text-neutral-400 mb-3">{playlist.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="capitalize">{playlist.platform}</span>
                    <span>{playlist.trackCount || 0} tracks</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
