"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Plus, ExternalLink } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  platform: string;
  url: string;
  imageUrl?: string;
  tags: string[];
}

export default function WeeklyMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const platforms = ["all", "bandcamp", "soundcloud", "mixcloud", "beatport"];

  useEffect(() => {
    fetchTracks();
  }, [selectedPlatform]);

  const fetchTracks = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPlatform !== "all") params.set("platform", selectedPlatform);

      const response = await fetch(`/api/music/weekly?${params}`);
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error("Failed to fetch tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">
            Weekly Curated Music
          </h1>
          <div className="flex gap-2">
            {platforms.map((platform) => (
              <Button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                variant="outline"
                className={`capitalize ${
                  selectedPlatform === platform
                    ? "bg-[#D1FF3D] text-black border-[#D1FF3D]"
                    : "border-[#333333] text-white hover:bg-[#1a1a1a]"
                }`}
              >
                {platform}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-500 col-span-3">Loading tracks...</p>
          ) : tracks.length === 0 ? (
            <p className="text-gray-500 col-span-3">No tracks found</p>
          ) : (
            tracks.map((track) => (
              <Card
                key={track.id}
                className="bg-[#111111] border-[#1a1a1a] overflow-hidden"
              >
                {track.imageUrl && (
                  <div className="aspect-square bg-[#0a0a0a]">
                    <img
                      src={track.imageUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-medium mb-1 line-clamp-1">
                    {track.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">{track.artist}</p>
                  <div className="flex gap-2 mb-3">
                    {track.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
                      asChild
                    >
                      <a
                        href={track.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Listen
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#333333] text-white hover:bg-[#1a1a1a]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
