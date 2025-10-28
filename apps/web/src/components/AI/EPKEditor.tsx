
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Download, FileText, Link as LinkIcon, Loader2 } from 'lucide-react';

export function EPKEditor() {
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState({ soundcloud: '', bandcamp: '', instagram: '' });
  const [tracks, setTracks] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [epkUrl, setEpkUrl] = useState<string | null>(null);

  const handleAutoFill = async () => {
    const scLink = socialLinks.soundcloud;
    if (!scLink) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/epk/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundcloudUrl: scLink }),
      });

      const data = await response.json();
      if (data.artist) setArtistName(data.artist);
      if (data.bio) setBio(data.bio);
      if (data.genre) setGenre(data.genre);
    } catch (error) {
      console.error('Auto-fill failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEPK = async () => {
    setIsGenerating(true);
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
      });

      const data = await response.json();
      if (data.pdfUrl) {
        setEpkUrl(data.pdfUrl);
      }
    } catch (error) {
      console.error('EPK generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

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
                  onChange={(e) => setSocialLinks({ ...socialLinks, soundcloud: e.target.value })}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
                <Input
                  placeholder="Bandcamp URL"
                  value={socialLinks.bandcamp}
                  onChange={(e) => setSocialLinks({ ...socialLinks, bandcamp: e.target.value })}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
                <Input
                  placeholder="Instagram URL"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleAutoFill}
              variant="outline"
              className="w-full border-[#333333] text-white hover:bg-[#1a1a1a]"
              disabled={isGenerating || !socialLinks.soundcloud}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Auto-fill from SoundCloud
            </Button>

            <Button
              onClick={handleGenerateEPK}
              disabled={isGenerating || !artistName}
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
}
