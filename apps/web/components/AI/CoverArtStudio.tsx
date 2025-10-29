'use client';

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, Sparkles, RefreshCw } from 'lucide-react';
import { useAIJobPolling } from '@/lib/hooks/useAIJobPolling';

const STYLE_PRESETS = [
  { id: 'neon', label: 'Neon Accent', gradient: 'from-purple-500 via-pink-500 to-purple-600' },
  { id: 'monochrome', label: 'Monochrome', gradient: 'from-gray-900 via-gray-600 to-gray-400' },
  { id: 'geometric', label: 'Geometric', gradient: 'from-orange-500 via-yellow-500 to-orange-600' },
  { id: 'brutalist', label: 'Brutalist', gradient: 'from-gray-800 via-red-800 to-gray-900' },
  { id: 'cybergrind', label: 'Cybergrind', gradient: 'from-black via-cyan-500 to-green-500' },
  { id: 'vaporwave', label: 'Vaporwave', gradient: 'from-pink-400 via-purple-300 to-blue-400' },
  { id: 'chromatic-grid', label: 'Chromatic Grid', gradient: 'from-red-500 via-green-500 to-blue-500' },
  { id: 'noir-light', label: 'Noir Light', gradient: 'from-black via-gray-500 to-white' },
  { id: 'acid-geometry', label: 'Acid Geometry', gradient: 'from-yellow-400 via-green-400 to-cyan-400' },
  { id: 'liquid-metal', label: 'Liquid Metal', gradient: 'from-gray-400 via-gray-100 to-gray-500' },
] as const;

const ASPECT_RATIOS = ['1:1', '16:9', '4:3', '3:4'] as const;
const RESOLUTIONS = ['512x512', '768x768', '1024x1024', '1920x1080'] as const;

interface Render {
  id: string;
  url: string;
  prompt: string;
}

const RecentRenderCard = memo(({ render, onSelect }: { render: Render; onSelect: () => void }) => (
  <div 
    className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a] cursor-pointer hover:border-[#333333] transition-colors"
    onClick={onSelect}
  >
    <img 
      src={render.url} 
      alt={render.prompt} 
      className="w-full h-32 object-cover rounded mb-2"
      loading="lazy"
      decoding="async"
    />
    <p className="text-sm text-gray-400 line-clamp-2">{render.prompt}</p>
  </div>
));
RecentRenderCard.displayName = 'RecentRenderCard';

// Add text overlay to image using Canvas API
const addTextOverlayToImage = (imageUrl: string, artist: string, release: string, style: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // For SVG data URLs, we need to ensure proper dimensions
    const isSvg = imageUrl.startsWith('data:image/svg+xml');
    img.src = imageUrl;

    img.onload = () => {
      try {
        // Use explicit dimensions for SVG (fallback to 1024x1024)
        const width = isSvg ? 1024 : img.width;
        const height = isSvg ? 1024 : img.height;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        if (!ctx) {
          console.warn('Could not get canvas context');
          resolve(imageUrl);
          return;
        }

        // Draw the base image
        ctx.drawImage(img, 0, 0, width, height);

        // Style configurations
        const styleConfigs: Record<string, { textColor: string; shadowColor: string; bgColor: string }> = {
          'neon': { textColor: '#D1FF3D', shadowColor: '#9333EA', bgColor: 'rgba(0, 0, 0, 0.75)' },
          'monochrome': { textColor: '#FFFFFF', shadowColor: '#000000', bgColor: 'rgba(0, 0, 0, 0.85)' },
          'geometric': { textColor: '#FFA500', shadowColor: '#FF6B00', bgColor: 'rgba(0, 0, 0, 0.7)' },
          'brutalist': { textColor: '#FF3333', shadowColor: '#990000', bgColor: 'rgba(20, 20, 20, 0.9)' },
          'cybergrind': { textColor: '#00FF00', shadowColor: '#00CCCC', bgColor: 'rgba(0, 0, 0, 0.85)' },
          'vaporwave': { textColor: '#FF71CE', shadowColor: '#01CDFE', bgColor: 'rgba(0, 0, 0, 0.7)' },
          'chromatic-grid': { textColor: '#FF006E', shadowColor: '#8338EC', bgColor: 'rgba(0, 0, 0, 0.8)' },
          'noir-light': { textColor: '#FFFFFF', shadowColor: '#666666', bgColor: 'rgba(0, 0, 0, 0.6)' },
          'acid-geometry': { textColor: '#FFFF00', shadowColor: '#FF00FF', bgColor: 'rgba(0, 0, 0, 0.85)' },
          'liquid-metal': { textColor: '#E0E0E0', shadowColor: '#505050', bgColor: 'rgba(0, 0, 0, 0.75)' }
        };

        const config = styleConfigs[style] || styleConfigs['neon'];
        const padding = 50;
        const bottomPadding = 30;

        // Calculate responsive font sizes
        const artistFontSize = Math.max(56, Math.min(width / 15, 80));
        const releaseFontSize = Math.max(36, Math.min(width / 25, 48));
        const watermarkFontSize = 18;

        // Measure text to create proper background
        let totalTextHeight = bottomPadding;
        let maxTextWidth = 0;

        if (artist) {
          ctx.font = `bold ${artistFontSize}px "Arial Black", Arial, sans-serif`;
          const artistMetrics = ctx.measureText(artist);
          maxTextWidth = Math.max(maxTextWidth, artistMetrics.width);
          totalTextHeight += artistFontSize + 10;
        }

        if (release) {
          ctx.font = `600 ${releaseFontSize}px Arial, sans-serif`;
          const releaseMetrics = ctx.measureText(release);
          maxTextWidth = Math.max(maxTextWidth, releaseMetrics.width);
          totalTextHeight += releaseFontSize + 10;
        }

        // Draw semi-transparent background box for text
        if (artist || release) {
          const bgPadding = 25;
          const bgX = padding - bgPadding;
          const bgY = img.height - totalTextHeight - bgPadding;
          const bgWidth = maxTextWidth + (bgPadding * 2);
          const bgHeight = totalTextHeight + bgPadding;

          ctx.fillStyle = config.bgColor;
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        }

        let currentY = height - bottomPadding;

        // Draw release title (bottom)
        if (release) {
          ctx.font = `600 ${releaseFontSize}px Arial, sans-serif`;
          ctx.shadowColor = config.shadowColor;
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = config.textColor;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(release, padding, currentY);
          currentY -= releaseFontSize + 10;
        }

        // Draw artist name (above release)
        if (artist) {
          ctx.font = `bold ${artistFontSize}px "Arial Black", Arial, sans-serif`;
          ctx.shadowColor = config.shadowColor;
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
          ctx.fillStyle = config.textColor;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(artist, padding, currentY);
        }

        // Add watermark in bottom right
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.font = `${watermarkFontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('thecueRoom.com', width - padding, height - 20);

        const dataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(dataUrl);
      } catch (err) {
        console.error('Text overlay error:', err);
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      console.error('Image load error');
      resolve(imageUrl);
    };
  });
};

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
  const [progress, setProgress] = useState(0); // Added progress state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // Added for final image

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const { status, resultUrl, error: jobError, isLoading: isPolling } = useAIJobPolling({ jobId });

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update preview and recent renders when job completes
  useEffect(() => {
    if (status === 'completed' && generatedImage && isMountedRef.current) {
      setPreviewUrl(generatedImage);
      setRecentRenders(prev => [{
        id: jobId || Date.now().toString(),
        url: generatedImage,
        prompt
      }, ...prev.slice(0, 5)]);
    }
  }, [status, generatedImage, jobId, prompt]);

  // Show job errors
  useEffect(() => {
    if (jobError && isMountedRef.current) {
      setError(jobError);
    }
  }, [jobError]);

  // Add text overlay wrapper
  const addTextOverlay = useCallback(async (imageUrl: string): Promise<string> => {
    return addTextOverlayToImage(imageUrl, artist, release, style);
  }, [artist, release, style]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating || !prompt.trim()) {
      if (!prompt.trim()) setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

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

      if (!isMountedRef.current) return;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover art');
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      if (data.jobId) {
        setJobId(data.jobId);
        setProgress(10); // Start progress for polling

        // Poll for job completion with exponential backoff
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/ai/job/${data.jobId}`);
            if (!statusRes.ok) throw new Error('Poll failed');
            
            const job = await statusRes.json();
            pollCount++;

            if (job.status === 'completed') {
              clearInterval(pollInterval);
              setProgress(100);
              // Store the raw image without text overlay
              setGeneratedImage(job.resultUrl);
              setIsGenerating(false);
            } else if (job.status === 'failed') {
              clearInterval(pollInterval);
              setError(job.error || 'Generation failed');
              setIsGenerating(false);
            } else {
              // Update progress more conservatively
              setProgress(prev => Math.min(prev + 3, 85));
            }
          } catch (err) {
            console.error('Poll error:', err);
            if (pollCount > 30) { // Stop after 30 seconds
              clearInterval(pollInterval);
              setError('Generation timeout - please try again');
              setIsGenerating(false);
            }
          }
        }, 1000);
      } else {
        throw new Error('No job ID returned');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError' && isMountedRef.current) {
        setError(err.message);
        console.error('Failed to generate:', err);
        setIsGenerating(false); // Ensure generation stops on error
        setProgress(0);
      }
    } finally {
      // Note: isGenerating is set to false within the polling logic or catch block
      // We only need to ensure it's reset if the initial fetch fails before jobId is set.
      if (!jobId && isMountedRef.current) {
         setIsGenerating(false);
      }
    }
  }, [prompt, style, artist, release, aspect, resolution, seed, isGenerating]);

  const handleReset = useCallback(() => {
    setPrompt('');
    setArtist('');
    setRelease('');
    setSeed('');
    setJobId(null);
    setError(null);
    setPreviewUrl(null);
    setGeneratedImage(null); // Reset generated image
    setProgress(0);
    setIsGenerating(false); // Ensure generation state is reset
  }, []);

  const handleDownload = useCallback(async (url: string) => {
    // Add text overlay before downloading
    let finalUrl = url;
    if (artist || release) {
      finalUrl = await addTextOverlay(url);
    }
    
    // Determine file extension based on data URL type
    const isSvg = finalUrl.startsWith('data:image/svg+xml');
    const isPng = finalUrl.startsWith('data:image/png');
    const extension = isSvg ? 'svg' : isPng ? 'png' : 'jpg';
    
    const a = document.createElement('a');
    a.href = finalUrl;
    a.download = `cover-art-${Date.now()}.${extension}`;
    a.click();
  }, [artist, release, addTextOverlay]);

  const handleSelectRender = useCallback((url: string) => {
    setPreviewUrl(url);
    setGeneratedImage(url); // Also set generatedImage to allow download of selected render
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Create Cover Art</h2>
              <div className="text-xs px-2 py-1 rounded bg-[#D1FF3D]/10 text-[#D1FF3D] border border-[#D1FF3D]/20">
                AI + Style Preset
              </div>
            </div>

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
                <Label htmlFor="style" className="text-white text-sm mb-1 block">Style Preset</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger 
                    id="style"
                    className="bg-[#0a0a0a] border-[#1a1a1a] text-white text-sm h-10"
                  >
                    <SelectValue placeholder="Select a style">
                      {STYLE_PRESETS.find(p => p.id === style)?.label || 'Select a style'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-[#1a1a1a] max-h-[300px]">
                    {STYLE_PRESETS.map((preset) => (
                      <SelectItem 
                        key={preset.id} 
                        value={preset.id}
                        className="text-white hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] cursor-pointer py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-16 rounded bg-gradient-to-r ${preset.gradient}`} />
                          <span>{preset.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                decoding="async"
              />
            ) : isGenerating ? (
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#D1FF3D] animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-400">Generating your artwork...</p>
                {progress > 0 && (
                  <p className="text-xs text-gray-500 mt-2">{progress}%</p>
                )}
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
        <div className="grid grid-cols-2 gap-3 mb-6 max-h-[400px] overflow-y-auto">
          {recentRenders.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-2">No renders yet</p>
          ) : (
            recentRenders.slice(0, 6).map((render) => (
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