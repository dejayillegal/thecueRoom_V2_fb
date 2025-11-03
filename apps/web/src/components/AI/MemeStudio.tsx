"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Download, Share2, Sparkles } from "lucide-react";

const MEME_TEMPLATES = [
  { id: "drake", name: "Drake", imageUrl: "/meme-templates/drake.jpg" },
  {
    id: "distracted",
    name: "Distracted Boyfriend",
    imageUrl: "/meme-templates/distracted.jpg",
  },
  { id: "stonks", name: "Stonks", imageUrl: "/meme-templates/stonks.jpg" },
  { id: "custom", name: "Custom Upload", imageUrl: null },
];

export function MemeStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState("drake");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [watermark, setWatermark] = useState(true);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/meme/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          topText,
          bottomText,
          watermark,
        }),
      });

      const data = await response.json();
      if (data.url) {
        setGeneratedUrl(data.url);
      }
    } catch (error) {
      console.error("Failed to generate meme:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedUrl) return;
    const a = document.createElement("a");
    a.href = generatedUrl;
    a.download = `meme-${Date.now()}.png`;
    a.click();
  };

  const handleShare = async () => {
    console.log("Share to forum");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Controls */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Create Meme</h2>

          <div className="space-y-4">
            <div>
              <Label className="text-white text-sm mb-2 block">Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {MEME_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedTemplate === template.id
                        ? "border-[#D1FF3D] bg-[#D1FF3D]/10"
                        : "border-[#1a1a1a] hover:border-[#333333]"
                    }`}
                  >
                    <span className="text-sm text-white">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="topText" className="text-white text-sm">
                Top Text
              </Label>
              <Input
                id="topText"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="Enter top text..."
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>

            <div>
              <Label htmlFor="bottomText" className="text-white text-sm">
                Bottom Text
              </Label>
              <Input
                id="bottomText"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="Enter bottom text..."
                className="mt-1 bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="watermark"
                checked={watermark}
                onChange={(e) => setWatermark(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="watermark" className="text-white text-sm">
                Add thecueRoom watermark
              </Label>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!topText && !bottomText)}
              className="w-full bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Meme
            </Button>
          </div>
        </div>
      </Card>

      {/* Right Column - Preview & Actions */}
      <Card className="bg-[#111111] border-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
        <div className="aspect-square bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#1a1a1a] mb-4">
          {generatedUrl ? (
            <img
              src={generatedUrl}
              alt="Generated meme"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <p className="text-gray-500 text-sm">Your meme will appear here</p>
          )}
        </div>

        {generatedUrl && (
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 border-[#333333] text-white hover:bg-[#1a1a1a]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share to Forum
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
