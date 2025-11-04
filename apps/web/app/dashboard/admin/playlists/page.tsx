
'use client';

import { useState, useEffect } from 'react';
import { PlaylistEditor } from '@/components/Admin/PlaylistEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react';

interface Playlist {
  id: string;
  title: string;
  description?: string;
  platform: string;
  status: string;
  curatedAt?: string;
  curatorName?: string;
}

export default function AdminPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  async function loadPlaylists() {
    setLoading(true);
    try {
      const res = await fetch('/api/playlists/list?scope=admin&limit=50');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.data);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePlaylist(id: string) {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const res = await fetch('/api/playlists/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, archive: true }),
      });

      if (res.ok) {
        alert('Playlist archived');
        loadPlaylists();
      }
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  }

  if (creating || editing) {
    return (
      <PlaylistEditor
        playlistId={editing || undefined}
        onSave={() => {
          setCreating(false);
          setEditing(null);
          loadPlaylists();
        }}
        onCancel={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Playlist Management</h1>
          <p className="text-neutral-400 text-sm">Create and manage weekly playlists</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-lime-500 hover:bg-lime-600 text-black">
          <Plus size={18} className="mr-2" />
          Create Playlist
        </Button>
      </div>

      {loading ? (
        <div className="text-neutral-400 text-center py-12">Loading playlists...</div>
      ) : playlists.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800 p-12 text-center">
          <p className="text-neutral-400 mb-4">No playlists yet</p>
          <Button onClick={() => setCreating(true)} className="bg-lime-500 hover:bg-lime-600 text-black">
            Create Your First Playlist
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="bg-neutral-900 border-neutral-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{playlist.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        playlist.status === 'live'
                          ? 'bg-lime-500/20 text-lime-500'
                          : playlist.status === 'queued'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {playlist.status}
                    </span>
                  </div>
                  {playlist.description && (
                    <p className="text-neutral-400 text-sm mb-3">{playlist.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span className="capitalize">{playlist.platform}</span>
                    {playlist.curatedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(playlist.curatedAt).toLocaleDateString()}
                      </span>
                    )}
                    {playlist.curatorName && <span>By {playlist.curatorName}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(playlist.id)}
                    className="border-neutral-700"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePlaylist(playlist.id)}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
