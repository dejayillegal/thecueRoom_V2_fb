"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, User, Loader2 } from "lucide-react";

const AVATAR_STYLES = ["minimal", "geometric", "abstract", "neon"];
const HAIR_STYLES = ["short", "long", "mohawk", "bald"];
const ACCENT_COLORS = ["#D1FF3D", "#873BBF", "#FF3D7F", "#3DFFCB"];

export function AvatarGenerator() {
  const [style, setStyle] = useState("minimal");
  const [hair, setHair] = useState("short");
  const [accentColor, setAccentColor] = useState("#D1FF3D");
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, hair, accentColor }),
      });

      const data = await response.json();
      if (data.url) {
        setAvatarUrl(data.url);
      }
    } catch (error) {
      console.error("Avatar generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-[#111111] border-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-6">
          Generate Avatar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {AVATAR_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`p-2 rounded border capitalize text-sm ${
                      style === s
                        ? "border-[#D1FF3D] bg-[#D1FF3D]/10 text-white"
                        : "border-[#1a1a1a] text-gray-400 hover:border-[#333333]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Hair</label>
              <div className="grid grid-cols-2 gap-2">
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHair(h)}
                    className={`p-2 rounded border capitalize text-sm ${
                      hair === h
                        ? "border-[#D1FF3D] bg-[#D1FF3D]/10 text-white"
                        : "border-[#1a1a1a] text-gray-400 hover:border-[#333333]"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">
                Accent Color
              </label>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      accentColor === color
                        ? "border-white"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Generate Avatar
                </>
              )}
            </Button>
          </div>

          <div>
            <div className="aspect-square bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#1a1a1a] mb-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Generated avatar"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <User className="w-24 h-24 text-gray-600" />
              )}
            </div>

            {avatarUrl && (
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[#333333] text-white hover:bg-[#1a1a1a]"
                >
                  Use as Avatar
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
