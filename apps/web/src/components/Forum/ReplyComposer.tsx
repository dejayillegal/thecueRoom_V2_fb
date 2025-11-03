'use client';

import { useState } from 'react';
import { safeFetch } from '../../lib/safe-fetch';

interface ReplyComposerProps {
  onSubmit: (content: string, images?: string[]) => Promise<void>;
  placeholder?: string;
}

export default function ReplyComposer({
  onSubmit,
  placeholder = 'Write your reply...',
}: ReplyComposerProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [moderationResult, setModerationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImages([...images, event.target.result as string]);
      }
    };
    reader.readAsDataURL(files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSubmitting(true);
    setError(null);
    setModerationResult(null);

    try {
      // Pre-check with moderation API
      const moderationResponse = await safeFetch('/api/forum/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!moderationResponse.ok) {
        throw new Error('Moderation check failed');
      }

      const modResult = moderationResponse.data;
      setModerationResult(modResult);

      // If flagged, show warning but allow manual override for borderline cases
      if (modResult.flagged && modResult.severity === 'high') {
        setError(
          `Your reply was flagged for: ${modResult.reasons?.join(', ') || 'inappropriate content'}. Please revise.`
        );
        setSubmitting(false);
        return;
      }

      // Submit the reply
      await onSubmit(content, images);

      // Reset form
      setContent('');
      setImages([]);
      setModerationResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {moderationResult?.flagged && moderationResult.severity !== 'high' && (
        <div className="bg-yellow-900/20 border border-yellow-500/50 text-yellow-200 p-3 rounded-lg text-sm">
          <p className="font-semibold">Content Warning</p>
          <p>Your content may contain: {moderationResult.reasons?.join(', ')}. Please review before posting.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={submitting}
        />
        <p className="mt-1 text-sm text-gray-500">
          {content.length} / 10,000 characters
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Add Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={submitting}
            />
          </label>

          <div className="text-xs text-gray-400">
            Allowed: SoundCloud, Spotify, Bandcamp, Mixcloud, YouTube Music, Beatport links
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Posting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Post Reply
            </>
          )}
        </button>
      </div>
    </form>
  );
}
