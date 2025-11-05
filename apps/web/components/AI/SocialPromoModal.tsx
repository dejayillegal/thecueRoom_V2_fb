
'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Download, Share2 } from 'lucide-react';

interface SocialPromoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROMO_TYPES = [
  { id: 'release', label: 'Release Announcement' },
  { id: 'gig', label: 'Gig/Event Promo' },
  { id: 'general', label: 'General Update' },
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'soundcloud', label: 'SoundCloud' },
];

export function SocialPromoModal({ open, onOpenChange }: SocialPromoModalProps) {
  const [type, setType] = useState('release');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['instagram']);
  const [themeColor, setThemeColor] = useState('#D1FF3D');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPromo, setGeneratedPromo] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/social-promo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title || undefined,
          description,
          platforms,
          themeColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate promo');
      }

      const data = await response.json();
      setGeneratedPromo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [type, title, description, platforms, themeColor]);

  const handleDownload = useCallback(() => {
    if (!generatedPromo?.imageUrl) return;
    
    const a = document.createElement('a');
    a.href = generatedPromo.imageUrl;
    a.download = `promo-${Date.now()}.png`;
    a.click();
  }, [generatedPromo]);

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black border-lime-400/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-lime-400">AI Social Promo Generator</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-lime-400">Promo Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-lime-400">Title (Optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New Release, Gig Night, etc."
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-lime-400">Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you're promoting..."
                rows={4}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-lime-400">Platforms</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`px-3 py-2 rounded border text-sm ${
                      platforms.includes(p.id)
                        ? 'bg-lime-400/20 border-lime-400 text-lime-400'
                        : 'bg-gray-900 border-gray-700 text-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-lime-400">Theme Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <Input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="w-full bg-lime-400 text-black hover:bg-lime-500"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Promo
                </>
              )}
            </Button>
          </div>

          {/* Right: Preview */}
          <div>
            <Label className="text-lime-400 mb-2 block">Preview</Label>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 min-h-[400px] flex items-center justify-center">
              {generatedPromo ? (
                <div className="space-y-4 w-full">
                  {generatedPromo.imageUrl && (
                    <img
                      src={generatedPromo.imageUrl}
                      alt="Generated promo"
                      className="w-full rounded-lg"
                    />
                  )}
                  <div className="bg-black/50 rounded p-3">
                    <p className="text-white text-sm mb-2">{generatedPromo.content?.caption}</p>
                    {generatedPromo.content?.tags && (
                      <p className="text-lime-400 text-xs">
                        {generatedPromo.content.tags.join(' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownload}
                      className="flex-1 bg-lime-400 text-black hover:bg-lime-500"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-700 text-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">
                  Your promo will appear here
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
