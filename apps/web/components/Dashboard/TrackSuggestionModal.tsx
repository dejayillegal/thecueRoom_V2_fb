
'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TrackSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TrackSuggestionModal({ isOpen, onClose, onSuccess }: TrackSuggestionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    trackPlatform: 'spotify',
    trackUrl: '',
    trackTitle: '',
    artistName: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/playlists/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Track suggestion submitted successfully! We\'ll review it for the next playlist.');
        setFormData({
          trackPlatform: 'spotify',
          trackUrl: '',
          trackTitle: '',
          artistName: '',
          notes: '',
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const error = await res.json();
        alert(`Failed to submit: ${error.error}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit track suggestion');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Suggest a Track</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              value={formData.trackPlatform}
              onChange={(e) => setFormData({ ...formData, trackPlatform: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
              required
            >
              <option value="spotify">Spotify</option>
              <option value="soundcloud">SoundCloud</option>
              <option value="beatport">Beatport</option>
              <option value="mixcloud">Mixcloud</option>
              <option value="bandcamp">Bandcamp</option>
              <option value="youtube_music">YouTube Music</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackUrl">Track URL *</Label>
            <Input
              id="trackUrl"
              type="url"
              value={formData.trackUrl}
              onChange={(e) => setFormData({ ...formData, trackUrl: e.target.value })}
              placeholder="https://open.spotify.com/track/..."
              className="bg-neutral-800 border-neutral-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trackTitle">Track Title</Label>
              <Input
                id="trackTitle"
                value={formData.trackTitle}
                onChange={(e) => setFormData({ ...formData, trackTitle: e.target.value })}
                placeholder="Track name"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistName">Artist Name</Label>
              <Input
                id="artistName"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                placeholder="Your artist name"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Why should this track be featured?"
              className="bg-neutral-800 border-neutral-700"
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Plus size={18} className="mr-2" />
              {submitting ? 'Submitting...' : 'Submit Track'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
