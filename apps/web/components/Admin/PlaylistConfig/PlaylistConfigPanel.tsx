
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Music, Link as LinkIcon, Loader2 } from 'lucide-react';
import { PlaylistPreviewCard } from './PlaylistPreviewCard';
import { PlaylistScheduler } from './PlaylistScheduler';
import { PlaylistHistoryList } from './PlaylistHistoryList';
import { PlaylistMetadata } from '@thecueroom/shared/adminPlaylistSchemas';
import { useToast } from '@/hooks/use-toast';

export function PlaylistConfigPanel() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [metadata, setMetadata] = useState<PlaylistMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoCuration, setAutoCuration] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { toast } = useToast();

  const validatePlaylist = async () => {
    if (!playlistUrl) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/playlists/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: playlistUrl }),
      });

      const data = await res.json();

      if (data.ok) {
        setMetadata(data.metadata);
        toast({
          title: 'Playlist validated',
          description: 'Spotify playlist metadata loaded successfully',
        });
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
    }
  };

  const createPlaylist = async (status: 'draft' | 'publish' | 'schedule', scheduledAt?: string) => {
    if (!metadata) return;

    setLoading(true);
    try {
      // Create playlist
      const createRes = await fetch('/api/admin/playlists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metadata,
          autoCurated: false,
        }),
      });

      const createData = await createRes.json();

      if (!createData.ok) {
        throw new Error('Failed to create playlist');
      }

      // If publish or schedule, do that action
      if (status === 'publish' || status === 'schedule') {
        const publishRes = await fetch('/api/admin/playlists/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminPlaylistId: createData.playlist.id,
            publishNow: status === 'publish',
            scheduledAt: scheduledAt,
          }),
        });

        const publishData = await publishRes.json();

        if (!publishData.ok) {
          throw new Error('Failed to publish playlist');
        }

        toast({
          title: status === 'publish' ? 'Playlist published!' : 'Playlist scheduled',
          description:
            status === 'publish'
              ? 'Weekly Curated Music updated successfully'
              : 'Playlist will be published at scheduled time',
        });
      } else {
        toast({
          title: 'Draft saved',
          description: 'Playlist saved as draft',
        });
      }

      // Reset form
      setPlaylistUrl('');
      setMetadata(null);
      setShowScheduler(false);
      loadHistory();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Operation failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/admin/playlists/list?history=true');
      const data = await res.json();
      if (data.ok && data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleRollback = async (historyId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/playlists/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({
          title: 'Rollback successful',
          description: 'Playlist restored from history',
        });
        loadHistory();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Rollback failed',
        description: error instanceof Error ? error.message : 'Could not rollback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoCuration = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/playlists/toggle-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      const data = await res.json();

      if (data.ok) {
        setAutoCuration(enabled);
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Playlist Configuration</h1>
        <p className="text-neutral-400">
          Configure and manage the Weekly Curated Music playlist
        </p>
      </div>

      {/* Auto-curation toggle */}
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-1">AI Auto-Curation</h3>
            <p className="text-sm text-neutral-400">
              Automatically generate playlists with AI curation
            </p>
          </div>
          <Switch checked={autoCuration} onCheckedChange={toggleAutoCuration} />
        </div>
      </Card>

      {/* Playlist URL input */}
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="text-lime-500" size={20} />
          <h3 className="text-lg font-semibold text-white">Add Spotify Playlist</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="playlist-url">Spotify Playlist URL</Label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <Input
                  id="playlist-url"
                  type="url"
                  placeholder="https://open.spotify.com/playlist/..."
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
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Validate'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview card */}
      {metadata && (
        <PlaylistPreviewCard
          metadata={metadata}
          onSaveDraft={() => createPlaylist('draft')}
          onPublishNow={() => createPlaylist('publish')}
          onSchedule={() => setShowScheduler(true)}
          loading={loading}
        />
      )}

      {/* History */}
      <PlaylistHistoryList history={history} onRollback={handleRollback} loading={loading} />

      {/* Scheduler modal */}
      <PlaylistScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        onSchedule={(date) => createPlaylist('schedule', date)}
        loading={loading}
      />
    </div>
  );
}
