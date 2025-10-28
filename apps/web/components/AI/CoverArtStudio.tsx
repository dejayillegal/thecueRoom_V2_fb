'use client';

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Download, Sparkles, RefreshCw } from 'lucide-react';
import { useAIJobPolling } from '@/lib/hooks/useAIJobPolling';

const STYLE_PRESETS = [
  { id: 'neon', label: 'Neon Accent', gradient: 'from-purple-500 to-pink-500' },
  { id: 'monochrome', label: 'Monochrome', gradient: 'from-gray-900 to-gray-600' },
  { id: 'geometric', label: 'Geometric', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'brutalist', label: 'Brutalist', gradient: 'from-red-500 to-orange-500' },
] as const;

const ASPECT_RATIOS = ['1:1', '16:9', '4:3', '3:4'] as const;
const RESOLUTIONS = ['512x512', '768x768', '1024x1024', '1920x1080'] as const;

interface Render {
  id: string;
  url: string;
  prompt: string;
}

const StylePresetButton = memo(({ 
  preset, 
  isSelected, 
  onClick 
}: { 
  preset: typeof STYLE_PRESETS[number];
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg border transition-all ${
      isSelected
        ? 'border-[#D1FF3D] bg-[#D1FF3D]/10'
        : 'border-[#1a1a1a] hover:border-[#333333]'
    }`}
  >
    <div className={`h-8 rounded bg-gradient-to-r ${preset.gradient} mb-2`} />
    <span className="text-xs text-white">{preset.label}</span>
  </button>
));
StylePresetButton.displayName = 'StylePresetButton';

const RecentRenderCard = memo(({ render }: { render: Render }) => (
  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
    <img 
      src={render.url} 
      alt={render.prompt} 
      className="w-full h-24 object-cover rounded mb-2"
      loading="lazy"
    />
    <p className="text-xs text-gray-400 line-clamp-2">{render.prompt}</p>
  </div>
));
RecentRenderCard.displayName = 'RecentRenderCard';

export const CoverArtStudio = memo(function CoverArtStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('neon');
  const [artist, setArtist] = useState('');
  const [release, setRelease] = useState('');
  const [aspect, setAspect] = useState('1:1');
  const [resolution, setResolution] = useState('1024x1024');
  const [seed, setSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [recentRenders, setRecentRenders] = useState<Render[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const { status, resultUrl, error: jobError, isLoading: isPolling } = useAIJobPolling({ jobId });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update recent renders when job completes
  useEffect(() => {
    if (status === 'completed' && resultUrl && prompt) {
      setRecentRenders(prev => [{
        id: jobId || Date.now().toString(),
        url: resultUrl,
        prompt
      }, ...prev.slice(0, 4)]);
    }
  }, [status, resultUrl, jobId, prompt]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cover-art',
          prompt,
          style,
          artist,
          release,
          aspect,
          resolution,
          seed: seed || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover art');
      }

      const data = await response.json();
      if (data.jobId) {
        setJobId(data.jobId);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Failed to generate:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, artist, release, aspect, resolution, seed]);

  const handleReset = useCallback(() => {
    setPrompt('');
    setArtist('');
    setRelease('');
    setSeed('');
    setJobId(null);
    setError(null);
  }, []);

  const handleDownload = useCallback((url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-art-${Date.now()}.png`;
    a.click();
  }, []);

  const handleStyleSelect = useCallback((styleId: string) => {
    setStyle(styleId);
  }, []);

  const isGenerateDisabled = useMemo(
    () => isGenerating || isPolling || !prompt.trim(),
    [isGenerating, isPolling, prompt]
  );

  const hasResult = useMemo(
    () => status === 'completed' && resultUrl,
    [status, resultUrl]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Controls */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Create Cover Art</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt" className="text-white text-sm">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your cover art vision..."
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-white text-sm mb-2 block">Style Preset</Label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <StylePresetButton
                    key={preset.id}
                    preset={preset}
                    isSelected={style === preset.id}
                    onClick={() => handleStyleSelect(preset.id)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="artist" className="text-white text-sm">Artist Name</Label>
                <Input
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>
              <div>
                <Label htmlFor="release" className="text-white text-sm">Release Title</Label>
                <Input
                  id="release"
                  value={release}
                  onChange={(e) => setRelease(e.target.value)}
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aspect" className="text-white text-sm">Aspect Ratio</Label>
                <select
                  id="aspect"
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value)}
                  className="mt-1 w-full p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-white text-sm"
                >
                  {ASPECT_RATIOS.map((ratio) => (
                    <option key={ratio} value={ratio}>{ratio}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="resolution" className="text-white text-sm">Resolution</Label>
                <select
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="mt-1 w-full p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-white text-sm"
                >
                  {RESOLUTIONS.map((res) => (
                    <option key={res} value={res}>{res}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="seed" className="text-white text-sm">Seed (optional)</Label>
              <Input
                id="seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Random"
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] font-semibold"
              >
                {isGenerating || isPolling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPolling ? 'Generating...' : 'Starting...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-[#333333] text-white hover:bg-[#1a1a1a]"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Middle Column - Preview */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
        <div className="aspect-square bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#1a1a1a]">
          {hasResult ? (
            <img 
              src={resultUrl!} 
              alt="Generated cover art" 
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : isPolling ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#D1FF3D] animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Generating your artwork...</p>
              <p className="text-xs text-gray-500 mt-2">This may take a moment...</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Your artwork will appear here</p>
          )}
        </div>

        {hasResult && (
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => handleDownload(resultUrl!)}
              className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleGenerate}
              variant="outline"
              className="border-[#333333] text-white hover:bg-[#1a1a1a]"
            >
              Generate Variation
            </Button>
          </div>
        )}
      </Card>

      {/* Right Column - Recent & Tips */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Renders</h2>
        <div className="space-y-3">
          {recentRenders.length === 0 ? (
            <p className="text-sm text-gray-500">No renders yet</p>
          ) : (
            recentRenders.map((render) => (
              <RecentRenderCard key={render.id} render={render} />
            ))
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
          <h3 className="text-sm font-semibold text-white mb-3">Tips</h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li>• Be specific with your prompt for better results</li>
            <li>• Try different style presets to match your aesthetic</li>
            <li>• Use the same seed to reproduce results</li>
            <li>• Higher resolutions take longer to generate</li>
          </ul>
        </div>
      </Card>
    </div>
  );
});
