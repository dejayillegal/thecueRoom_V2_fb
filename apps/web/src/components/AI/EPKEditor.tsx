'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Download, FileText, Sparkles, Loader2, Wand2, Send } from 'lucide-react';

interface EPKModule {
  id: string;
  type: 'bio' | 'tracklist' | 'techRider' | 'quotes' | 'links';
  data: any;
}

export function EPKEditor() {
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [pressQuotes, setPressQuotes] = useState('');
  const [techRider, setTechRider] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    soundcloud: '',
    bandcamp: '',
    instagram: '',
    spotify: '',
    website: ''
  });
  
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isImprovingBio, setIsImprovingBio] = useState(false);
  const [isGeneratingQuotes, setIsGeneratingQuotes] = useState(false);
  const [isGeneratingTechRider, setIsGeneratingTechRider] = useState(false);
  const [isGeneratingEPK, setIsGeneratingEPK] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiAvailable, setAIAvailable] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkAIAvailability();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkAIAvailability = async () => {
    try {
      const response = await fetch('/api/epk/ai/check');
      const data = await response.json();
      setAIAvailable(data.available || false);
    } catch (err) {
      setAIAvailable(false);
    }
  };

  const handleGenerateBio = useCallback(async () => {
    if (!artistName) {
      setError('Please enter artist name first');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsGeneratingBio(true);
    setError(null);

    try {
      const response = await fetch('/api/epk/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bio',
          artistName,
          genre: genre || undefined,
          tone: 'professional'
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate bio');
      }

      const data = await response.json();
      setBio(data.text);
      setSuccess(data.usedAI ? 'Bio generated with AI!' : 'Bio generated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Bio generation failed:', err);
      }
    } finally {
      setIsGeneratingBio(false);
    }
  }, [artistName, genre]);

  const handleImproveBio = useCallback(async () => {
    if (!bio) {
      setError('Please write or generate a bio first');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsImprovingBio(true);
    setError(null);

    try {
      const response = await fetch('/api/epk/ai/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: bio,
          tone: 'professional'
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to improve bio');
      }

      const data = await response.json();
      setBio(data.text);
      setSuccess(data.usedAI ? 'Bio improved with AI!' : 'Bio polished!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Bio improvement failed:', err);
      }
    } finally {
      setIsImprovingBio(false);
    }
  }, [bio]);

  const handleGenerateQuotes = useCallback(async () => {
    if (!artistName) {
      setError('Please enter artist name first');
      return;
    }

    setIsGeneratingQuotes(true);
    setError(null);

    try {
      const response = await fetch('/api/epk/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'press_quote',
          artistName,
          genre: genre || undefined,
          existingText: bio || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quotes');
      }

      const data = await response.json();
      setPressQuotes(data.text);
      setSuccess(data.usedAI ? 'Press quotes generated with AI!' : 'Press quotes generated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGeneratingQuotes(false);
    }
  }, [artistName, genre, bio]);

  const handleGenerateTechRider = useCallback(async () => {
    setIsGeneratingTechRider(true);
    setError(null);

    try {
      const response = await fetch('/api/epk/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tech_rider',
          artistName: artistName || 'Artist',
          genre: genre || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tech rider');
      }

      const data = await response.json();
      setTechRider(data.text);
      setSuccess('Tech rider generated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGeneratingTechRider(false);
    }
  }, [artistName, genre]);

  const handleGenerateEPK = useCallback(async () => {
    if (!artistName || !bio) {
      setError('Please fill in at least Artist Name and Bio');
      return;
    }

    setIsGeneratingEPK(true);
    setError(null);

    try {
      const modules: EPKModule[] = [
        { id: '1', type: 'bio', data: { text: bio } },
        ...(pressQuotes ? [{ id: '2', type: 'quotes' as const, data: { quotes: pressQuotes.split('\n\n').filter(q => q.trim()) } }] : []),
        ...(techRider ? [{ id: '3', type: 'techRider' as const, data: { items: techRider.split('\n').filter(i => i.trim()) } }] : []),
        ...(Object.values(socialLinks).some(v => v) ? [{ 
          id: '4', 
          type: 'links' as const, 
          data: { links: Object.entries(socialLinks).filter(([_, v]) => v).map(([k, v]) => ({ platform: k, url: v })) }
        }] : [])
      ];

      const response = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'brutalist-onepage',
          modules,
          artistName,
          releaseTitle: genre,
          exportFormat: 'pdf',
          includeWatermark: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate EPK');
      }

      const data = await response.json();
      setSuccess(`EPK queued! Job ID: ${data.jobId}`);
      
      setTimeout(() => {
        window.location.href = `/epk`;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'EPK generation failed');
    } finally {
      setIsGeneratingEPK(false);
    }
  }, [artistName, bio, genre, pressQuotes, techRider, socialLinks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 bg-[#0a0a0a] border-[#1a1a1a]">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-white">Artist Information</h2>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/50 rounded-lg text-primary text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm mb-2">Artist Name *</Label>
                <Input
                  placeholder="Your artist/DJ name"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2">Genre/Style</Label>
                <Input
                  placeholder="e.g., Techno, House, Drum & Bass"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-gray-300 text-sm">Biography *</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleGenerateBio}
                  disabled={isGeneratingBio || !artistName}
                  className="bg-primary hover:bg-primary/90 text-black"
                >
                  {isGeneratingBio ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Generate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImproveBio}
                  disabled={isImprovingBio || !bio}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  {isImprovingBio ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
                  Improve
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="Write about your musical journey, sound, and what makes you unique..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[150px]"
            />
            {!aiAvailable && (
              <p className="text-xs text-gray-500 mt-2">
                ℹ️ AI features available with OpenAI API key
              </p>
            )}
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-gray-300 text-sm">Press Quotes (Optional)</Label>
              <Button
                size="sm"
                onClick={handleGenerateQuotes}
                disabled={isGeneratingQuotes || !artistName}
                className="bg-[#9B5CFF] hover:bg-[#8B4CEF] text-white"
              >
                {isGeneratingQuotes ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Generate
              </Button>
            </div>
            <Textarea
              placeholder="Add press quotes or reviews..."
              value={pressQuotes}
              onChange={(e) => setPressQuotes(e.target.value)}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[100px]"
            />
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-gray-300 text-sm">Tech Rider (Optional)</Label>
              <Button
                size="sm"
                onClick={handleGenerateTechRider}
                disabled={isGeneratingTechRider}
                className="bg-[#9B5CFF] hover:bg-[#8B4CEF] text-white"
              >
                {isGeneratingTechRider ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Generate
              </Button>
            </div>
            <Textarea
              placeholder="Equipment requirements, stage setup, etc..."
              value={techRider}
              onChange={(e) => setTechRider(e.target.value)}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[100px]"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-[#0a0a0a] border-[#1a1a1a]">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Social Links</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1">SoundCloud</Label>
                <Input
                  placeholder="https://soundcloud.com/your-profile"
                  value={socialLinks.soundcloud}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, soundcloud: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1">Spotify</Label>
                <Input
                  placeholder="https://open.spotify.com/artist/..."
                  value={socialLinks.spotify}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, spotify: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1">Bandcamp</Label>
                <Input
                  placeholder="https://your-artist.bandcamp.com"
                  value={socialLinks.bandcamp}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, bandcamp: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1">Instagram</Label>
                <Input
                  placeholder="https://instagram.com/your-profile"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1">Website</Label>
                <Input
                  placeholder="https://your-website.com"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <div className="bg-gradient-to-br from-primary/10 to-[#9B5CFF]/10 p-6 rounded-lg border border-primary/20">
              <h3 className="text-lg font-bold text-white mb-2">Generate Your EPK</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a professional PDF press kit ready to send to promoters, venues, and labels.
              </p>
              <Button
                onClick={handleGenerateEPK}
                disabled={isGeneratingEPK || !artistName || !bio}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
                size="lg"
              >
                {isGeneratingEPK ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating EPK...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate EPK PDF
                  </>
                )}
              </Button>
              {(!artistName || !bio) && (
                <p className="text-xs text-yellow-500 mt-2 text-center">
                  * Artist name and bio are required
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <div className="bg-[#0B0B0B] p-4 rounded-lg border border-[#1a1a1a]">
              <h4 className="text-sm font-bold text-white mb-2">💡 Pro Tips</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Use AI to generate a professional bio in seconds</li>
                <li>• Include your best press quotes to build credibility</li>
                <li>• Tech rider helps venues prepare for your performance</li>
                <li>• Social links make it easy for promoters to find your music</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
