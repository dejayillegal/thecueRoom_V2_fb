"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ExternalLink, Play } from "lucide-react";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

interface MonthlyPlaylist {
  id: string;
  title: string;
  embedUrl?: string;
  externalUrl?: string;
  trackCount?: number;
  curatedAt?: string;
}

interface MonthlyPlaylistWidgetProps {
  className?: string;
}

export function MonthlyPlaylistWidget({ className = "" }: MonthlyPlaylistWidgetProps) {
  const [playlist, setPlaylist] = useState<MonthlyPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/overview`);
        const data = await response.json();
        
        if (data.monthlyPlaylist) {
          setPlaylist(data.monthlyPlaylist);
        }
      } catch (err) {
        console.error("Failed to fetch playlist:", err);
        setError("Failed to load playlist");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (isLoading) {
    return <SkeletonCard variant="wide" className={className} />;
  }

  if (error || !playlist) {
    return null;
  }

  return (
    <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-xl font-semibold">Monthly Playlist</h2>
          {playlist.curatedAt && (
            <p className="text-gray-400 text-xs mt-1">
              {formatDate(playlist.curatedAt)}
            </p>
          )}
        </div>
        {playlist.externalUrl && (
          <Link href={playlist.externalUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="text-[#D7FF3C] hover:text-[#c8f02f] hover:bg-[#1a1a1a]">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
          </Link>
        )}
      </div>

      {playlist.embedUrl ? (
        <div className="relative">
          {!embedLoaded && (
            <div className="absolute inset-0 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Music className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading playlist...</p>
              </div>
            </div>
          )}
          <iframe
            src={playlist.embedUrl}
            width="100%"
            height="380"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            onLoad={() => setEmbedLoaded(true)}
            className="rounded-lg"
            title={playlist.title}
          />
        </div>
      ) : (
        <div className="bg-[#0a0a0a] rounded-lg p-8 border border-[#1a1a1a]">
          <div className="text-center">
            <Music className="h-16 w-16 text-[#D7FF3C] mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">{playlist.title}</h3>
            {playlist.trackCount && (
              <p className="text-gray-400 text-sm mb-4">
                {playlist.trackCount} tracks
              </p>
            )}
            {playlist.externalUrl && (
              <Link href={playlist.externalUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#D7FF3C] text-black hover:bg-[#c8f02f]">
                  <Play className="h-4 w-4 mr-2" />
                  Listen Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
