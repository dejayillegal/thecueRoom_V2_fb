
'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical, Save, Eye, Calendar, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface PlaylistItem {
  id?: string;
  trackPlatform: string;
  trackId: string;
  trackTitle: string;
  artistName: string;
  trackUrl?: string;
  previewUrl?: string;
  coverImage?: string;
  position: number;
  aiScore?: number;
  aiRationale?: string;
}

interface Playlist {
  id?: string;
  title: string;
  description?: string;
  platform: string;
  platformId?: string;
  embedUrl?: string;
  thumbnail?: string;
  weekOf?: string;
  status: string;
  visibility: string;
  items: PlaylistItem[];
}

interface PlaylistEditorProps {
  playlistId?: string;
  onSave?: (playlist: Playlist) => void;
  onCancel?: () => void;
}

export function PlaylistEditor({ playlistId, onSave, onCancel }: PlaylistEditorProps) {
  const [playlist, setPlaylist] = useState<Playlist>({
    title: '',
    description: '',
    platform: 'spotify',
    status: 'draft',
    visibility: 'public',
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTrack, setNewTrack] = useState({
    trackPlatform: 'spotify',
    trackId: '',
    trackTitle: '',
    artistName: '',
    trackUrl: '',
  });

  useEffect(() => {
    if (playlistId) {
      loadPlaylist(playlistId);
    }
  }, [playlistId]);

  async function loadPlaylist(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlists/get/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data.playlist);
      }
    } catch (error) {
      console.error('Failed to load playlist:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const items = Array.from(playlist.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setPlaylist({ ...playlist, items: updatedItems });
  }

  function addTrack() {
    if (!newTrack.trackTitle || !newTrack.artistName) {
      alert('Please fill in track title and artist name');
      return;
    }

    const track: PlaylistItem = {
      ...newTrack,
      position: playlist.items.length,
    };

    setPlaylist({
      ...playlist,
      items: [...playlist.items, track],
    });

    setNewTrack({
      trackPlatform: 'spotify',
      trackId: '',
      trackTitle: '',
      artistName: '',
      trackUrl: '',
    });
  }

  function removeTrack(index: number) {
    const items = playlist.items.filter((_, i) => i !== index);
    const updatedItems = items.map((item, i) => ({ ...item, position: i }));
    setPlaylist({ ...playlist, items: updatedItems });
  }

  async function savePlaylist() {
    setSaving(true);
    try {
      const res = await fetch('/api/playlists/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlist),
      });

      if (res.ok) {
        const data = await res.json();
        alert('Playlist saved successfully!');
        if (onSave) onSave(data.playlist);
      } else {
        const error = await res.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save playlist');
    } finally {
      setSaving(false);
    }
  }

  async function publishPlaylist() {
    if (!playlist.id) {
      alert('Please save the playlist first');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/playlists/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: playlist.id,
          publish: true,
        }),
      });

      if (res.ok) {
        alert('Playlist published successfully!');
        loadPlaylist(playlist.id);
      } else {
        const error = await res.json();
        alert(`Failed to publish: ${error.error}`);
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish playlist');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-400">Loading playlist...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {playlistId ? 'Edit Playlist' : 'Create Playlist'}
        </h1>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={savePlaylist} disabled={saving}>
            <Save size={18} className="mr-2" />
            Save Draft
          </Button>
          {playlist.id && playlist.status !== 'live' && (
            <Button onClick={publishPlaylist} disabled={saving} className="bg-lime-500 hover:bg-lime-600 text-black">
              <Eye size={18} className="mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Playlist Title</Label>
            <Input
              id="title"
              value={playlist.title}
              onChange={(e) => setPlaylist({ ...playlist, title: e.target.value })}
              placeholder="Weekly Underground Techno"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              value={playlist.platform}
              onChange={(e) => setPlaylist({ ...playlist, platform: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
            >
              <option value="spotify">Spotify</option>
              <option value="soundcloud">SoundCloud</option>
              <option value="beatport">Beatport</option>
              <option value="mixcloud">Mixcloud</option>
              <option value="bandcamp">Bandcamp</option>
              <option value="youtube_music">YouTube Music</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={playlist.description || ''}
            onChange={(e) => setPlaylist({ ...playlist, description: e.target.value })}
            placeholder="Curated selection of underground tracks..."
            className="bg-neutral-800 border-neutral-700"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="embedUrl">Embed URL</Label>
            <Input
              id="embedUrl"
              value={playlist.embedUrl || ''}
              onChange={(e) => setPlaylist({ ...playlist, embedUrl: e.target.value })}
              placeholder="https://open.spotify.com/embed/playlist/..."
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekOf">Week Of</Label>
            <Input
              id="weekOf"
              type="date"
              value={playlist.weekOf || ''}
              onChange={(e) => setPlaylist({ ...playlist, weekOf: e.target.value })}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              value={playlist.visibility}
              onChange={(e) => setPlaylist({ ...playlist, visibility: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
            >
              <option value="public">Public</option>
              <option value="featured">Featured</option>
              <option value="admin">Admin Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Add Track Form */}
      <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Plus size={20} className="text-lime-500" />
          Add Track
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <Input
            placeholder="Track Title"
            value={newTrack.trackTitle}
            onChange={(e) => setNewTrack({ ...newTrack, trackTitle: e.target.value })}
            className="bg-neutral-800 border-neutral-700"
          />
          <Input
            placeholder="Artist Name"
            value={newTrack.artistName}
            onChange={(e) => setNewTrack({ ...newTrack, artistName: e.target.value })}
            className="bg-neutral-800 border-neutral-700"
          />
          <Input
            placeholder="Track ID"
            value={newTrack.trackId}
            onChange={(e) => setNewTrack({ ...newTrack, trackId: e.target.value })}
            className="bg-neutral-800 border-neutral-700"
          />
          <Input
            placeholder="Track URL"
            value={newTrack.trackUrl}
            onChange={(e) => setNewTrack({ ...newTrack, trackUrl: e.target.value })}
            className="bg-neutral-800 border-neutral-700"
          />
          <Button onClick={addTrack} className="bg-lime-500 hover:bg-lime-600 text-black">
            <Plus size={18} className="mr-2" />
            Add
          </Button>
        </div>
      </Card>

      {/* Track List */}
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Music size={20} className="text-lime-500" />
          Tracks ({playlist.items.length})
        </h2>

        {playlist.items.length === 0 ? (
          <p className="text-neutral-400 text-center py-8">No tracks yet. Add some above!</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tracks">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {playlist.items.map((track, index) => (
                    <Draggable key={index} draggableId={`track-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-4 rounded-lg border ${
                            snapshot.isDragging
                              ? 'bg-neutral-700 border-lime-500'
                              : 'bg-neutral-800 border-neutral-700'
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="text-neutral-400 cursor-grab">
                            <GripVertical size={20} />
                          </div>
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div>
                              <div className="text-white font-medium">{track.trackTitle}</div>
                              <div className="text-neutral-400 text-sm">{track.artistName}</div>
                            </div>
                            <div className="text-neutral-300 text-sm">
                              {track.trackPlatform}
                            </div>
                            <div className="text-neutral-400 text-sm truncate">
                              {track.trackUrl || track.trackId}
                            </div>
                            <div className="text-neutral-500 text-sm">
                              Position: {index + 1}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTrack(index)}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Card>
    </div>
  );
}
