'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Download, Sparkles, RefreshCw, Shuffle } from 'lucide-react';
import { useAIJobPolling } from '@/lib/hooks/useAIJobPolling';

const STYLE_PRESETS = [
  { id: 'neon-accent', label: 'Neon Accent', gradient: 'from-purple-500 via-pink-500 to-purple-600', description: 'Purple/pink glow, chrome shapes' },
  { id: 'monochrome', label: 'Monochrome', gradient: 'from-gray-900 to-gray-400', description: 'Black/white brutalist grid' },
  { id: 'geometric', label: 'Geometric', gradient: 'from-orange-500 via-yellow-500 to-orange-600', description: 'Polygons, structured shapes' },
  { id: 'brutalist', label: 'Brutalist', gradient: 'from-gray-800 via-red-800 to-gray-900', description: 'Industrial gradients, textures' },
  { id: 'cybergrind', label: 'Cybergrind', gradient: 'from-black via-cyan-500 to-green-500', description: 'Glitchy circuits, blue lasers' },
  { id: 'vaporwave', label: 'Vaporwave', gradient: 'from-pink-400 via-purple-300 to-blue-400', description: 'Pastel gradients, digital sun' },
  { id: 'chromatic-grid', label: 'Chromatic Grid', gradient: 'from-red-500 via-green-500 to-blue-500', description: 'Rainbow grids, blur filters' },
  { id: 'noir-light', label: 'Noir Light', gradient: 'from-black via-gray-500 to-white', description: 'High-contrast light shafts' },
  { id: 'acid-geometry', label: 'Acid Geometry', gradient: 'from-yellow-400 via-green-400 to-cyan-400', description: 'Neon geometric chaos' },
  { id: 'liquid-metal', label: 'Liquid Metal', gradient: 'from-gray-400 via-gray-100 to-gray-500', description: 'Silver distortions, wave mesh' },
];

const ASPECT_RATIOS = ['1:1', '16:9', '4:3', '3:4'];
const RESOLUTIONS = ['512x512', '768x768', '1024x1024', '1920x1080'];

export function CoverArtStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('neon-accent');
  const [artist, setArtist] = useState('');
  const [release, setRelease] = useState('');
  const [aspect, setAspect] = useState('1:1');
  const [resolution, setResolution] = useState('1024x1024');
  const [seed, setSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [recentRenders, setRecentRenders] = useState<Array<{ id: string; url: string; prompt: string }>>([]);
  const [hasAIKey, setHasAIKey] = useState<boolean | null>(null);

  const { job, isPolling } = useAIJobPolling(jobId);

  useEffect(() => {
    fetch('/api/ai/env')
      .then(res => res.json())
      .then(data => setHasAIKey(data.hasAIKey))
      .catch(() => setHasAIKey(false));
  }, []);

  const handleRandomize = () => {
    const randomPreset = STYLE_PRESETS[Math.floor(Math.random() * STYLE_PRESETS.length)];
    const randomSeed = Math.floor(Math.random() * 1000000);
    setStyle(randomPreset.id);
    setSeed(randomSeed.toString());
  };

  const handleGenerate = async () => {
    if (!hasAIKey && !prompt.trim() && !artist && !release) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cover-art',
          prompt: hasAIKey ? prompt : '',
          params: {
            style,
            artist,
            release,
            aspect,
            resolution,
            seed: seed || undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.jobId) {
        setJobId(data.jobId);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setArtist('');
    setRelease('');
    setSeed('');
    setJobId(null);
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-art-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Controls Card */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6 space-y-6 w-full">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Create Cover Art</h2>
            {hasAIKey === false && (
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                SVG Fallback Mode
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt" className="text-white text-sm">
                Prompt {hasAIKey === false && <span className="text-gray-500 text-xs">(Disabled - No AI Key)</span>}
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={hasAIKey === false ? "AI prompt disabled - using procedural SVG generation" : "Describe your cover art vision..."}
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white min-h-[100px]"
                disabled={hasAIKey === false}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white text-sm">Style Preset</Label>
                <Button
                  onClick={handleRandomize}
                  size="sm"
                  variant="outline"
                  className="border-[#333333] text-white hover:bg-[#1a1a1a] text-xs h-7"
                >
                  <Shuffle className="w-3 h-3 mr-1" />
                  Randomize
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setStyle(preset.id)}
                    className={`p-3 rounded-lg border transition-all group ${
                      style === preset.id
                        ? 'border-[#D1FF3D] bg-[#D1FF3D]/10 shadow-lg shadow-[#D1FF3D]/20'
                        : 'border-[#1a1a1a] hover:border-[#D1FF3D]/50 hover:shadow-md hover:shadow-[#D1FF3D]/10'
                    }`}
                    title={preset.description}
                  >
                    <div className={`h-12 rounded bg-gradient-to-r ${preset.gradient} mb-2 transition-transform group-hover:scale-105`} />
                    <span className="text-xs text-white font-medium">{preset.label}</span>
                  </button>
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
                  placeholder="Artist name"
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>
              <div>
                <Label htmlFor="release" className="text-white text-sm">Release Title</Label>
                <Input
                  id="release"
                  value={release}
                  onChange={(e) => setRelease(e.target.value)}
                  placeholder="Album/EP title"
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <Label htmlFor="seed" className="text-white text-sm">Seed</Label>
                <Input
                  id="seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isPolling || (hasAIKey === true && !prompt.trim())}
                className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] font-semibold"
              >
                {isGenerating || isPolling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
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
            
            {hasAIKey === false && (
              <p className="text-xs text-gray-500 text-center">
                🎨 Generated locally — Add HF_TOKEN or GOOGLE_API_KEY to enable AI generation
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Middle Column - Preview */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
        <div className="aspect-square bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#1a1a1a]">
          {job?.status === 'completed' && job.resultUrl ? (
            <img src={job.resultUrl} alt="Generated cover art" className="w-full h-full object-cover rounded-lg" />
          ) : isPolling ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#D1FF3D] animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Generating your artwork...</p>
              {job?.progress && <p className="text-xs text-gray-500 mt-2">{job.progress}%</p>}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Your artwork will appear here</p>
          )}
        </div>

        {job?.status === 'completed' && job.resultUrl && (
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => handleDownload(job.resultUrl!)}
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
        <h2 className="text-lg font-semibold text-white mb-4">Tips</h2>
        <ul className="space-y-3 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-[#D1FF3D] mt-1">•</span>
            <span><strong className="text-white">Fallback Mode:</strong> No AI key required - generates high-quality procedural SVG art</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D1FF3D] mt-1">•</span>
            <span><strong className="text-white">Randomize:</strong> Click to get a random preset and seed for unique variations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D1FF3D] mt-1">•</span>
            <span><strong className="text-white">Style Presets:</strong> Each preset uses distinct algorithms for professional results</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D1FF3D] mt-1">•</span>
            <span><strong className="text-white">Artist/Release:</strong> Add text to be integrated into the artwork design</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D1FF3D] mt-1">•</span>
            <span><strong className="text-white">Seed:</strong> Use the same seed to reproduce exact results</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D1FF3D] mt-1">•</span>
            <span><strong className="text-white">AI Mode:</strong> Add HF_TOKEN to Secrets for Hugging Face Stable Diffusion XL</span>
          </li>
        </ul>

        <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
          <h3 className="text-sm font-semibold text-white mb-3">Available Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_PRESETS.slice(0, 6).map((preset) => (
              <div key={preset.id} className="text-xs">
                <div className={`h-3 rounded bg-gradient-to-r ${preset.gradient} mb-1`} />
                <p className="text-gray-500">{preset.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
