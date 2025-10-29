
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
  { id: 'neon', label: 'Neon Accent', gradient: 'from-purple-500 via-pink-500 to-purple-600' },
  { id: 'monochrome', label: 'Monochrome', gradient: 'from-gray-900 via-gray-600 to-gray-400' },
  { id: 'geometric', label: 'Geometric', gradient: 'from-blue-500 via-cyan-500 to-blue-600' },
  { id: 'brutalist', label: 'Brutalist', gradient: 'from-red-500 via-orange-500 to-red-600' },
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
    className={`p-2 rounded-md border transition-all ${
      isSelected
        ? 'border-[#D1FF3D] bg-[#D1FF3D]/10'
        : 'border-[#1a1a1a] hover:border-[#333333]'
    }`}
  >
    <div className={`h-6 rounded bg-gradient-to-r ${preset.gradient} mb-1.5`} />
    <span className="text-xs text-white">{preset.label}</span>
  </button>
));
StylePresetButton.displayName = 'StylePresetButton';

const RecentRenderCard = memo(({ render, onSelect }: { render: Render; onSelect: () => void }) => (
  <div 
    className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a] cursor-pointer hover:border-[#333333] transition-all"
    onClick={onSelect}
  >
    <img 
      src={render.url} 
      alt={render.prompt} 
      className="w-full h-32 object-cover rounded mb-2"
      loading="lazy"
    />
    <p className="text-sm text-gray-400 line-clamp-2">{render.prompt}</p>
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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

  // Update preview and recent renders when job completes
  useEffect(() => {
    if (status === 'completed' && resultUrl && prompt) {
      setPreviewUrl(resultUrl);
      setRecentRenders(prev => [{
        id: jobId || Date.now().toString(),
        url: resultUrl,
        prompt
      }, ...prev.slice(0, 5)]);
    }
  }, [status, resultUrl, jobId, prompt]);

  // Show job errors
  useEffect(() => {
    if (jobError) {
      setError(jobError);
    }
  }, [jobError]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsGenerating(true);
    setError(null);
    setJobId(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cover-art',
          prompt,
          params: {
            style,
            artist,
            release,
            aspect,
            resolution,
            seed: seed || undefined,
          }
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover art');
      }

      const data = await response.json();
      if (data.jobId) {
        setJobId(data.jobId);
      } else {
        throw new Error('No job ID returned');
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
    setPreviewUrl(null);
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

  const handleSelectRender = useCallback((url: string) => {
    setPreviewUrl(url);
  }, []);

  const isGenerateDisabled = useMemo(
    () => isGenerating || isPolling || !prompt.trim(),
    [isGenerating, isPolling, prompt]
  );

  const hasResult = useMemo(
    () => previewUrl !== null,
    [previewUrl]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Controls & Preview */}
      <div className="space-y-6">
        {/* Controls Card */}
        <Card className="bg-[#111111] border-[#1a1a1a] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Create Cover Art</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-white text-sm mb-1 block">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your cover art vision..."
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm min-h-[100px]"
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
                  <Label htmlFor="artist" className="text-white text-sm mb-1 block">Artist Name</Label>
                  <Input
                    id="artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="release" className="text-white text-sm mb-1 block">Release Title</Label>
                  <Input
                    id="release"
                    value={release}
                    onChange={(e) => setRelease(e.target.value)}
                    className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aspect" className="text-white text-sm mb-1 block">Aspect Ratio</Label>
                  <select
                    id="aspect"
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value)}
                    className="w-full p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-white text-sm"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio} value={ratio}>{ratio}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="resolution" className="text-white text-sm mb-1 block">Resolution</Label>
                  <select
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md text-white text-sm"
                  >
                    {RESOLUTIONS.map((res) => (
                      <option key={res} value={res}>{res}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="seed" className="text-white text-sm mb-1 block">Seed (optional)</Label>
                <Input
                  id="seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm"
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
                  className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] font-semibold text-sm"
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
                  className="border-[#333333] text-white hover:bg-[#1a1a1a] text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview Card */}
        <Card className="bg-[#111111] border-[#1a1a1a] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
          <div className="aspect-square bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#1a1a1a]">
            {hasResult ? (
              <img 
                src={previewUrl!} 
                alt="Generated cover art" 
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
              />
            ) : isPolling ? (
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#D1FF3D] animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-400">Generating your artwork...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment...</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Your artwork will appear here</p>
            )}
          </div>

          {hasResult && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => handleDownload(previewUrl!)}
                className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={handleGenerate}
                variant="outline"
                className="border-[#333333] text-white hover:bg-[#1a1a1a] text-sm"
              >
                Generate Variation
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Right Column - Recent Renders & Tips */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6 h-fit">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Renders</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {recentRenders.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-2">No renders yet</p>
          ) : (
            recentRenders.map((render) => (
              <RecentRenderCard 
                key={render.id} 
                render={render}
                onSelect={() => handleSelectRender(render.url)}
              />
            ))
          )}
        </div>

        <div className="pt-6 border-t border-[#1a1a1a]">
          <h3 className="text-sm font-semibold text-white mb-3">Tips</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Be specific with your prompt for better results</li>
            <li>• Try different style presets to match your aesthetic</li>
            <li>• Use the same seed to reproduce results</li>
            <li>• Higher resolutions take longer to generate</li>
            <li>• Click on recent renders to view them again</li>
          </ul>
        </div>
      </Card>
    </div>
  );
});
