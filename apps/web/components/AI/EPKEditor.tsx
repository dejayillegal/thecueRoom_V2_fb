'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Download, FileText, Sparkles, Loader2, Wand2, Send, Plus, X, Eye, Check } from 'lucide-react';

interface EPKModule {
  id: string;
  type: 'bio' | 'tracklist' | 'techRider' | 'quotes' | 'links';
  data: any;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  previewThumbnail?: string;
  supportedModules: string[];
  colorScheme: {
    primary: string;
    accent: string;
    secondary: string;
    background: string;
    text: string;
  };
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

  const [mixItems, setMixItems] = useState<Array<{ id: string; title: string; link: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('brutalist-onepage');
  const [templates, setTemplates] = useState<Template[]>([]);

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
    loadTemplates();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/epk/templates');
      const data = await response.json();
      if (data.ok) {
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          setSelectedTemplate(data.templates[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const checkAIAvailability = async () => {
    try {
      const response = await fetch('/api/epk/ai/check');
      const data = await response.json();
      setAIAvailable(data.hasAnyAI || false);
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

  const handleAddMixItem = useCallback(() => {
    setMixItems(prev => [...prev, { id: Date.now().toString(), title: '', link: '' }]);
  }, []);

  const handleRemoveMixItem = useCallback((id: string) => {
    setMixItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUpdateMixItem = useCallback((id: string, field: 'title' | 'link', value: string) => {
    setMixItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

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
        ...(mixItems.length > 0 ? [{ 
          id: '4', 
          type: 'tracklist' as const, 
          data: { tracks: mixItems.filter(item => item.title && item.link) }
        }] : []),
        ...(Object.values(socialLinks).some(v => v) ? [{ 
          id: '5', 
          type: 'links' as const, 
          data: { links: Object.entries(socialLinks).filter(([_, v]) => v).map(([k, v]) => ({ platform: k, url: v })) }
        }] : [])
      ];

      const response = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
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
  }, [artistName, bio, genre, pressQuotes, techRider, mixItems, socialLinks, selectedTemplate]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D1FF3D] rounded-lg flex items-center justify-center">
              <FileText className="w-7 h-7 text-black" />
            </div>
            AI EPK
          </h1>
          <p className="text-gray-400 text-lg">Create professional press kits with AI assistance</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-[#D1FF3D]/10 border border-[#D1FF3D]/50 rounded-lg text-[#D1FF3D]">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artist Information Card */}
            <Card className="bg-[#0a0a0a] border-[#222] p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D1FF3D]" />
                Artist Information
              </h2>

              <div className="space-y-5">
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">
                    Artist Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Your artist/DJ name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="bg-black border-[#333] text-white h-11 focus:border-[#D1FF3D] focus:ring-1 focus:ring-[#D1FF3D]"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">Genre/Style</Label>
                  <Input
                    placeholder="e.g., Techno, House, Drum & Bass"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="bg-black border-[#333] text-white h-11 focus:border-[#D1FF3D] focus:ring-1 focus:ring-[#D1FF3D]"
                  />
                </div>
              </div>
            </Card>

            {/* Biography Card */}
            <Card className="bg-[#0a0a0a] border-[#222] p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-gray-300 text-base font-semibold">
                  Biography <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleGenerateBio}
                    disabled={isGeneratingBio || !artistName}
                    className="bg-[#D1FF3D] hover:bg-[#D1FF3D]/90 text-black font-semibold h-9 px-4"
                  >
                    {isGeneratingBio ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImproveBio}
                    disabled={isImprovingBio || !bio}
                    className="border-[#D1FF3D]/30 text-[#D1FF3D] hover:bg-[#D1FF3D]/10 h-9 px-4"
                  >
                    {isImprovingBio ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    Improve
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Write about your musical journey, sound, and what makes you unique..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-black border-[#333] text-white min-h-[200px] focus:border-[#D1FF3D] focus:ring-1 focus:ring-[#D1FF3D] resize-none"
              />
            </Card>

            {/* Press Quotes Card */}
            <Card className="bg-[#0a0a0a] border-[#222] p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-gray-300 text-base font-semibold">Press Quotes (Optional)</Label>
                <Button
                  size="sm"
                  onClick={handleGenerateQuotes}
                  disabled={isGeneratingQuotes || !artistName}
                  className="bg-[#D1FF3D] hover:bg-[#D1FF3D]/90 text-black font-semibold h-9 px-4"
                >
                  {isGeneratingQuotes ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
              <Textarea
                placeholder="Add press quotes or reviews..."
                value={pressQuotes}
                onChange={(e) => setPressQuotes(e.target.value)}
                className="bg-black border-[#333] text-white min-h-[120px] focus:border-[#D1FF3D] focus:ring-1 focus:ring-[#D1FF3D] resize-none"
              />
            </Card>

            {/* Tech Rider Card */}
            <Card className="bg-[#0a0a0a] border-[#222] p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-gray-300 text-base font-semibold">Tech Rider (Optional)</Label>
                <Button
                  size="sm"
                  onClick={handleGenerateTechRider}
                  disabled={isGeneratingTechRider}
                  className="bg-[#D1FF3D] hover:bg-[#D1FF3D]/90 text-black font-semibold h-9 px-4"
                >
                  {isGeneratingTechRider ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
              <Textarea
                placeholder="Equipment requirements, stage setup, etc..."
                value={techRider}
                onChange={(e) => setTechRider(e.target.value)}
                className="bg-black border-[#333] text-white min-h-[120px] focus:border-[#D1FF3D] focus:ring-1 focus:ring-[#D1FF3D] resize-none"
              />
            </Card>
          </div>

          {/* Right Column - Templates & Settings */}
          <div className="space-y-6">
            {/* Social Links Card */}
            <Card className="bg-[#0a0a0a] border-[#222] p-6">
              <h2 className="text-lg font-bold text-white mb-4">Social Links</h2>
              <div className="space-y-4">
                {Object.keys(socialLinks).map((platform) => (
                  <div key={platform}>
                    <Label className="text-gray-400 text-xs mb-1.5 capitalize block">{platform}</Label>
                    <Input
                      placeholder={`https://${platform}.com/your-profile`}
                      value={socialLinks[platform as keyof typeof socialLinks]}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, [platform]: e.target.value }))}
                      className="bg-black border-[#333] text-white text-sm h-10 focus:border-[#D1FF3D] focus:ring-1 focus:ring-[#D1FF3D]"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Generate EPK Card */}
            <Card className="bg-gradient-to-br from-[#D1FF3D]/10 to-[#D1FF3D]/5 border-[#D1FF3D]/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Generate Your EPK</h3>
              <p className="text-sm text-gray-400 mb-5">
                Create a professional PDF press kit ready to send to promoters, venues, and labels.
              </p>
              <Button
                onClick={handleGenerateEPK}
                disabled={isGeneratingEPK || !artistName || !bio}
                className="w-full bg-[#D1FF3D] hover:bg-[#D1FF3D]/90 text-black font-bold h-12 text-base"
              >
                {isGeneratingEPK ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating EPK...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Generate EPK PDF
                  </>
                )}
              </Button>
              {(!artistName || !bio) && (
                <p className="text-xs text-yellow-500 mt-3 text-center">
                  * Artist name and bio are required
                </p>
              )}
            </Card>

            {/* Pro Tips Card */}
            <Card className="bg-[#0a0a0a] border-[#222] p-5">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                💡 Pro Tips
              </h4>
              <ul className="text-xs text-gray-400 space-y-2">
                <li>• Use AI to generate a professional bio in seconds</li>
                <li>• Include your best press quotes to build credibility</li>
                <li>• Tech rider helps venues prepare for your performance</li>
                <li>• Social links make it easy for promoters to find your music</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}