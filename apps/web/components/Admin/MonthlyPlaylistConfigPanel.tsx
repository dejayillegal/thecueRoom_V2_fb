
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Link as LinkIcon, Loader2, Calendar, Trash2, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MonthlyPlaylist } from '@thecueroom/shared/monthlyPlaylistSchemas';

export function MonthlyPlaylistConfigPanel() {
  const [playlists, setPlaylists] = useState<MonthlyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [autoCurationEnabled, setAutoCurationEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlaylists();
    loadAutoCurationStatus();
  }, [selectedStatus, selectedPlatform]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedPlatform !== 'all') params.set('platform', selectedPlatform);

      const res = await fetch(`/api/admin/monthly-playlists/list?${params}`);
      const data = await res.json();

      if (data.ok) {
        setPlaylists(data.playlists || []);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutoCurationStatus = async () => {
    try {
      const res = await fetch('/api/admin/monthly-playlists/auto-status');
      const data = await res.json();
      if (data.ok) {
        setAutoCurationEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Failed to load auto-curation status:', error);
    }
  };

  const validatePlaylist = async () => {
    if (!playlistUrl) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/monthly-playlists/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: playlistUrl }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({
          title: 'Playlist validated',
          description: `${data.metadata.platform} playlist ready to add`,
        });
        // Auto-create draft
        await createPlaylist(data.metadata);
      } else {
        toast({
          title: 'Validation failed',
          description: data.error || 'Could not validate playlist',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate playlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setPlaylistUrl('');
    }
  };

  const createPlaylist = async (metadata: any) => {
    try {
      const res = await fetch('/api/admin/monthly-playlists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metadata,
          monthOf: new Date().toISOString(),
          status: 'draft',
        }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({
          title: 'Playlist created',
          description: 'Draft saved successfully',
        });
        loadPlaylists();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        variant: 'destructive',
      });
    }
  };

  const publishPlaylist = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monthly-playlists/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({
          title: 'Playlist published',
          description: 'Now live on the platform',
        });
        loadPlaylists();
      } else {
        toast({
          title: 'Publish failed',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish playlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoCuration = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/monthly-playlists/toggle-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      const data = await res.json();

      if (data.ok) {
        setAutoCurationEnabled(enabled);
        toast({
          title: enabled ? 'Auto-curation enabled' : 'Auto-curation disabled',
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle auto-curation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Monthly Playlist Management</h1>
        <p className="text-neutral-400">Configure and manage monthly curated music playlists</p>
      </div>

      {/* Auto-curation toggle */}
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-1">AI Auto-Curation</h3>
            <p className="text-sm text-neutral-400">
              Automatically generate playlists when none are scheduled
            </p>
          </div>
          <Switch checked={autoCurationEnabled} onCheckedChange={toggleAutoCuration} />
        </div>
      </Card>

      {/* Add playlist */}
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="text-lime-500" size={20} />
          <h3 className="text-lg font-semibold text-white">Add New Playlist</h3>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <Input
              type="url"
              placeholder="https://open.spotify.com/playlist/... or SoundCloud/Mixcloud URL"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-700 text-white"
              disabled={loading}
            />
          </div>
          <Button
            onClick={validatePlaylist}
            disabled={!playlistUrl || loading}
            className="bg-lime-500 hover:bg-lime-600 text-black"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Add'}
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-neutral-300 mb-2">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-neutral-300 mb-2">Platform</Label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="spotify">Spotify</SelectItem>
                <SelectItem value="soundcloud">SoundCloud</SelectItem>
                <SelectItem value="mixcloud">Mixcloud</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Playlist list */}
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Playlists</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto text-lime-500" size={32} />
          </div>
        ) : playlists.length === 0 ? (
          <p className="text-neutral-400 text-center py-8">No playlists found</p>
        ) : (
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-neutral-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-white font-medium">{playlist.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      playlist.status === 'live' ? 'bg-lime-500 text-black' :
                      playlist.status === 'scheduled' ? 'bg-blue-500 text-white' :
                      playlist.status === 'draft' ? 'bg-neutral-600 text-white' :
                      'bg-neutral-700 text-neutral-300'
                    }`}>
                      {playlist.status}
                    </span>
                    {playlist.autoCurated && (
                      <span className="px-2 py-1 rounded text-xs bg-purple-500 text-white">
                        AI Curated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400 mt-1">
                    <span className="capitalize">{playlist.platform}</span>
                    <span>•</span>
                    <span>{playlist.trackCount || 0} tracks</span>
                    <span>•</span>
                    <span>
                      {new Date(playlist.monthOf).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {playlist.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => publishPlaylist(playlist.id)}
                      className="bg-lime-500 hover:bg-lime-600 text-black"
                    >
                      Publish
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="border-neutral-700">
                    <Eye size={14} />
                  </Button>
                  <Button size="sm" variant="outline" className="border-neutral-700">
                    <Edit size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
