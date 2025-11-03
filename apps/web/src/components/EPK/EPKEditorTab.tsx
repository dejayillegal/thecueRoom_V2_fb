"use client";

import { useState, useCallback } from "react";
import { EPKTemplate } from "@/data/epk-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EnhancedTechRiderPalette, {
  TechRiderItem,
} from "@/components/EPK/EnhancedTechRiderPalette";
import { Sparkles, Loader2, Plus, Trash2, ArrowRight } from "lucide-react";

export interface EPKData {
  template: EPKTemplate | null;
  artistName: string;
  genre: string;
  location: string;
  bio: string;
  pressQuotes: { id: string; text: string; source: string }[];
  venues: { id: string; name: string }[];
  links: {
    soundcloud: string;
    mixcloud: string;
    spotify: string;
    bandcamp: string;
    instagram: string;
    ra: string;
  };
  techRider: TechRiderItem[];
  images: string[];
}

interface EPKEditorTabProps {
  epkData: EPKData;
  onUpdateData: (data: Partial<EPKData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function EPKEditorTab({
  epkData,
  onUpdateData,
  onContinue,
  onBack,
}: EPKEditorTabProps) {
  const [isRewriting, setIsRewriting] = useState(false);

  const handleAIRewrite = useCallback(async () => {
    if (!epkData.bio) {
      alert("Please write a bio first");
      return;
    }

    setIsRewriting(true);
    try {
      const response = await fetch("/api/epk/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: epkData.bio,
          tone: "press",
        }),
      });

      const data = await response.json();

      if (data.ok && data.outputs?.epk_bio) {
        onUpdateData({ bio: data.outputs.epk_bio });
      }
    } catch (error) {
      console.error("AI rewrite error:", error);
    } finally {
      setIsRewriting(false);
    }
  }, [epkData.bio, onUpdateData]);

  const addQuote = () => {
    onUpdateData({
      pressQuotes: [
        ...epkData.pressQuotes,
        { id: Date.now().toString(), text: "", source: "" },
      ],
    });
  };

  const updateQuote = (id: string, field: "text" | "source", value: string) => {
    onUpdateData({
      pressQuotes: epkData.pressQuotes.map((q) =>
        q.id === id ? { ...q, [field]: value } : q,
      ),
    });
  };

  const removeQuote = (id: string) => {
    onUpdateData({
      pressQuotes: epkData.pressQuotes.filter((q) => q.id !== id),
    });
  };

  const addVenue = () => {
    onUpdateData({
      venues: [...epkData.venues, { id: Date.now().toString(), name: "" }],
    });
  };

  const updateVenue = (id: string, name: string) => {
    onUpdateData({
      venues: epkData.venues.map((v) => (v.id === id ? { ...v, name } : v)),
    });
  };

  const removeVenue = (id: string) => {
    onUpdateData({
      venues: epkData.venues.filter((v) => v.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Edit Your EPK Content
          </h2>
          <p className="text-sm text-gray-400">
            Fill in your artist information and let AI enhance it
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Template:{" "}
          <span className="text-[#D1FF3D]">{epkData.template?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-[#D1FF3D] mb-4">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  Artist / Project Name *
                </Label>
                <Input
                  value={epkData.artistName}
                  onChange={(e) => onUpdateData({ artistName: e.target.value })}
                  placeholder="Your artist name"
                  className="bg-black border-[#333] text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  Genre / Style
                </Label>
                <Input
                  value={epkData.genre}
                  onChange={(e) => onUpdateData({ genre: e.target.value })}
                  placeholder="Techno, House, Ambient..."
                  className="bg-black border-[#333] text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  Location
                </Label>
                <Input
                  value={epkData.location}
                  onChange={(e) => onUpdateData({ location: e.target.value })}
                  placeholder="City, Country"
                  className="bg-black border-[#333] text-white"
                />
              </div>
            </div>
          </div>

          {/* Biography with AI */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#D1FF3D]">
                Biography *
              </h3>
              <Button
                size="sm"
                onClick={handleAIRewrite}
                disabled={isRewriting || !epkData.bio}
                className="bg-[#9B5CFF] text-white hover:bg-[#9B5CFF]/90"
              >
                {isRewriting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI Enhance
              </Button>
            </div>

            <Textarea
              value={epkData.bio}
              onChange={(e) => onUpdateData({ bio: e.target.value })}
              placeholder="Write your artist biography here. The AI can help enhance and professionalize it..."
              className="bg-black border-[#333] text-white min-h-[200px]"
            />
          </div>

          {/* Press Quotes */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#D1FF3D]">
                Press Quotes
              </h3>
              <Button
                onClick={addQuote}
                size="sm"
                className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Quote
              </Button>
            </div>

            <div className="space-y-3">
              {epkData.pressQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="border border-[#333] rounded-lg p-3 space-y-2"
                >
                  <Textarea
                    value={quote.text}
                    onChange={(e) =>
                      updateQuote(quote.id, "text", e.target.value)
                    }
                    placeholder="Quote text..."
                    className="bg-black border-[#333] text-white min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={quote.source}
                      onChange={(e) =>
                        updateQuote(quote.id, "source", e.target.value)
                      }
                      placeholder="Source (e.g., DJ Mag)"
                      className="bg-black border-[#333] text-white flex-1"
                    />
                    <Button
                      onClick={() => removeQuote(quote.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notable Venues */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#D1FF3D]">
                Notable Venues
              </h3>
              <Button
                onClick={addVenue}
                size="sm"
                className="bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {epkData.venues.map((venue) => (
                <div key={venue.id} className="flex gap-2">
                  <Input
                    value={venue.name}
                    onChange={(e) => updateVenue(venue.id, e.target.value)}
                    placeholder="Venue name"
                    className="bg-black border-[#333] text-white flex-1"
                  />
                  <Button
                    onClick={() => removeVenue(venue.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-[#D1FF3D] mb-4">
              Social Links
            </h3>

            <div className="space-y-3">
              {Object.entries(epkData.links).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-gray-400 text-xs mb-1.5 capitalize block">
                    {key === "ra" ? "Resident Advisor" : key}
                  </Label>
                  <Input
                    value={value}
                    onChange={(e) =>
                      onUpdateData({
                        links: { ...epkData.links, [key]: e.target.value },
                      })
                    }
                    placeholder={`https://${key}.com/...`}
                    className="bg-black border-[#333] text-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tech Rider */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-[#D1FF3D] mb-4">
              Tech Rider
            </h3>
            <EnhancedTechRiderPalette
              items={epkData.techRider}
              onChange={(items) => onUpdateData({ techRider: items })}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-[#1a1a1a] p-4 -mx-4 flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border-[#333] text-white hover:bg-[#1a1a1a]"
        >
          Back to Templates
        </Button>
        <Button
          onClick={onContinue}
          disabled={!epkData.artistName || !epkData.bio}
          className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#D1FF3D]/90 font-semibold"
        >
          Preview & Export
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
