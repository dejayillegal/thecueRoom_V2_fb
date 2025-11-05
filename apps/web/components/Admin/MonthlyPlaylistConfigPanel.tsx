
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
  const [editingPlaylist, setEditingPlaylist] = useState<MonthlyPlaylist | null>(null);
  const [schedulingPlaylist, setSchedulingPlaylist] = useState<MonthlyPlaylist | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
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

      if (data.ok && data.valid) {
        toast({
          title: 'Playlist validated',
          description: `${data.platform} playlist ready to add`,
        });
        // Auto-create draft
        await createPlaylist({
          platform: data.platform,
          platformId: data.platformId,
          embedUrl: data.embedUrl,
          title: data.metadata.title,
          coverImage: data.metadata.coverImage,
          trackCount: data.metadata.trackCount,
        });
      } else {
        toast({
          title: 'Validation failed',
          description: data.error || 'Could not validate playlist',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to validate playlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setPlaylistUrl('');
    }
  };

  const createPlaylist = async (metadata: any) => {
    try {
      const now = new Date();
      const monthOf = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const res = await fetch('/api/admin/monthly-playlists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: metadata.title || 'Untitled Playlist',
          description: null,
          platform: metadata.platform,
          platformId: metadata.platformId,
          embedUrl: metadata.embedUrl,
          coverImage: metadata.coverImage || null,
          trackCount: metadata.trackCount || null,
          monthOf,
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
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create playlist',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Create playlist error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create playlist',
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
        body: JSON.stringify({ id, archivePrevious: true }),
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

  const schedulePlaylist = async (id: string, scheduledAt: Date) => {
    try {
      const res = await fetch('/api/admin/monthly-playlists/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, scheduledAt: scheduledAt.toISOString() }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({
          title: 'Playlist scheduled',
          description: `Will publish on ${scheduledAt.toLocaleDateString()}`,
        });
        loadPlaylists();
      } else {
        toast({
          title: 'Schedule failed',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule playlist',
        variant: 'destructive',
      });
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const res = await fetch(`/api/admin/monthly-playlists/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.ok) {
        toast({
          title: 'Playlist deleted',
          description: 'Successfully removed',
        });
        loadPlaylists();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete playlist',
        variant: 'destructive',
      });
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
    <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
      <div className="mb-6">
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
                    <>
                      <Button
                        size="sm"
                        onClick={() => publishPlaylist(playlist.id)}
                        className="bg-lime-500 hover:bg-lime-600 text-black"
                      >
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSchedulingPlaylist(playlist);
                          setScheduleDate('');
                        }}
                        className="border-neutral-700"
                      >
                        <Calendar size={14} className="mr-1" />
                        Schedule
                      </Button>
                    </>
                  )}
                  {playlist.status === 'scheduled' && (
                    <span className="text-xs text-neutral-400">
                      {new Date(playlist.scheduledAt!).toLocaleString()}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPlaylist(playlist)}
                    className="border-neutral-700"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePlaylist(playlist.id)}
                    className="border-neutral-700 text-red-500"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Schedule Modal */}
      {schedulingPlaylist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-neutral-900 border-neutral-800 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Schedule Playlist</h3>
            <p className="text-neutral-400 mb-4">
              Choose when to automatically publish "{schedulingPlaylist.title}"
            </p>
            <div className="space-y-4">
              <div>
                <Label className="text-neutral-300 mb-2">Publish Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (scheduleDate) {
                      schedulePlaylist(schedulingPlaylist.id, new Date(scheduleDate));
                      setSchedulingPlaylist(null);
                    }
                  }}
                  disabled={!scheduleDate}
                  className="bg-lime-500 hover:bg-lime-600 text-black flex-1"
                >
                  Schedule
                </Button>
                <Button
                  onClick={() => setSchedulingPlaylist(null)}
                  variant="outline"
                  className="border-neutral-700 flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingPlaylist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="bg-neutral-900 border-neutral-800 p-6 max-w-2xl w-full mx-4 my-8">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Playlist</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-neutral-300 mb-2">Title</Label>
                <Input
                  value={editingPlaylist.title}
                  onChange={(e) =>
                    setEditingPlaylist({ ...editingPlaylist, title: e.target.value })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-neutral-300 mb-2">Description</Label>
                <Input
                  value={editingPlaylist.description || ''}
                  onChange={(e) =>
                    setEditingPlaylist({ ...editingPlaylist, description: e.target.value })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-neutral-300 mb-2">Month</Label>
                <Input
                  type="month"
                  value={new Date(editingPlaylist.monthOf).toISOString().slice(0, 7)}
                  onChange={(e) =>
                    setEditingPlaylist({
                      ...editingPlaylist,
                      monthOf: new Date(e.target.value + '-01').toISOString(),
                    })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/admin/monthly-playlists/${editingPlaylist.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: editingPlaylist.title,
                          description: editingPlaylist.description,
                          monthOf: editingPlaylist.monthOf,
                        }),
                      });

                      if (res.ok) {
                        toast({
                          title: 'Playlist updated',
                          description: 'Changes saved successfully',
                        });
                        setEditingPlaylist(null);
                        loadPlaylists();
                      }
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to update playlist',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="bg-lime-500 hover:bg-lime-600 text-black flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setEditingPlaylist(null)}
                  variant="outline"
                  className="border-neutral-700 flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
