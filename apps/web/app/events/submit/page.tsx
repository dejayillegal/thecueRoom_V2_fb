
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

export default function EventSubmitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    date: '',
    venue: '',
    address: '',
    region: '',
    genre: '',
    ticketType: 'rsvp',
    ticketUrl: '',
    imageUrl: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit event');
      }

      // Redirect to dashboard or show success message
      router.push('/dashboard?event_submitted=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Submit Event</h1>
        
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="artist">Artist/Performer</Label>
              <Input
                id="artist"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                value={formData.date}
                onChange={handleChange}
                required
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="region">Region/City</Label>
              <Input
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="e.g., Techno, House, Drum & Bass"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="ticketType">Ticket Type</Label>
              <select
                id="ticketType"
                name="ticketType"
                value={formData.ticketType}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2"
              >
                <option value="rsvp">RSVP</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <Label htmlFor="ticketUrl">Ticket URL</Label>
              <Input
                id="ticketUrl"
                name="ticketUrl"
                type="url"
                value={formData.ticketUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Event Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-900 rounded-md p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Event'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-zinc-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
