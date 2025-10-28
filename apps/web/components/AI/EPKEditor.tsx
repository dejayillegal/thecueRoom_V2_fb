'use client';

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Download, FileText, Link as LinkIcon, Loader2 } from 'lucide-react';

interface SocialLinks {
  soundcloud: string;
  bandcamp: string;
  instagram: string;
}

export const EPKEditor = memo(function EPKEditor() {
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ 
    soundcloud: '', 
    bandcamp: '', 
    instagram: '' 
  });
  const [tracks, setTracks] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [epkUrl, setEpkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAutoFill = useCallback(async () => {
    const scLink = socialLinks.soundcloud;
    if (!scLink) return;

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/epk/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundcloudUrl: scLink }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to auto-fill from SoundCloud');
      }

      const data = await response.json();
      if (data.artist) setArtistName(data.artist);
      if (data.bio) setBio(data.bio);
      if (data.genre) setGenre(data.genre);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Auto-fill failed:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [socialLinks.soundcloud]);

  const handleGenerateEPK = useCallback(async () => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName,
          genre,
          bio,
          socialLinks,
          tracks: tracks.filter(t => t.trim()),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate EPK');
      }

      const data = await response.json();
      if (data.pdfUrl) {
        setEpkUrl(data.pdfUrl);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('EPK generation failed:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [artistName, genre, bio, socialLinks, tracks]);

  const updateSocialLink = useCallback((platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  }, []);

  const isAutoFillDisabled = useMemo(
    () => isGenerating || !socialLinks.soundcloud,
    [isGenerating, socialLinks.soundcloud]
  );

  const isGenerateEPKDisabled = useMemo(
    () => isGenerating || !artistName,
    [isGenerating, artistName]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-[#111111] border-[#1a1a1a] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">EPK Details</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="artistName" className="text-white text-sm">Artist Name</Label>
              <Input
                id="artistName"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>

            <div>
              <Label htmlFor="genre" className="text-white text-sm">Genre</Label>
              <Input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-white text-sm">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[120px]"
              />
            </div>

            <div>
              <Label className="text-white text-sm mb-2 block">Social Links</Label>
              <div className="space-y-2">
                <Input
                  placeholder="SoundCloud URL"
                  value={socialLinks.soundcloud}
                  onChange={(e) => updateSocialLink('soundcloud', e.target.value)}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
                <Input
                  placeholder="Bandcamp URL"
                  value={socialLinks.bandcamp}
                  onChange={(e) => updateSocialLink('bandcamp', e.target.value)}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
                <Input
                  placeholder="Instagram URL"
                  value={socialLinks.instagram}
                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleAutoFill}
              variant="outline"
              className="w-full border-[#333333] text-white hover:bg-[#1a1a1a]"
              disabled={isAutoFillDisabled}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Auto-fill from SoundCloud
            </Button>

            <Button
              onClick={handleGenerateEPK}
              disabled={isGenerateEPKDisabled}
              className="w-full bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate EPK
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="bg-[#111111] border-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
        {epkUrl ? (
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] p-4 overflow-auto">
              <embed src={epkUrl} type="application/pdf" className="w-full h-full" />
            </div>
            <Button
              onClick={() => window.open(epkUrl, '_blank')}
              className="w-full bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download EPK
            </Button>
          </div>
        ) : (
          <div className="aspect-[3/4] bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#1a1a1a]">
            <p className="text-gray-500 text-sm">EPK preview will appear here</p>
          </div>
        )}
      </Card>
    </div>
  );
});
