
'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Plus } from 'lucide-react';
import { ImageWithFallback } from '@/../../src/components/ImageWithFallback';

interface Track {
  id: string;
  title: string;
  artist: string;
  platform: string;
  url: string;
  imageUrl?: string;
  tags: string[];
}

const TrackCard = memo(({ track }: { track: Track }) => (
  <Card className="bg-[#111111] border-[#1a1a1a] overflow-hidden hover:border-[#D1FF3D]/30 transition-all duration-200">
    {track.imageUrl && (
      <div className="aspect-square bg-[#0a0a0a] relative">
        <ImageWithFallback
          src={track.imageUrl}
          alt={track.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={75}
        />
      </div>
    )}
    <div className="p-4">
      <h3 className="text-white font-medium mb-1 line-clamp-1">{track.title}</h3>
      <p className="text-gray-400 text-sm mb-3">{track.artist}</p>
      <div className="flex gap-2 mb-3">
        {track.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-1 rounded">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 bg-[#D1FF3D] text-black hover:bg-[#e7ff6f] transition-colors"
          asChild
        >
          <a href={track.url} target="_blank" rel="noopener noreferrer">
            <Play className="w-4 h-4 mr-2" />
            Listen
          </a>
        </Button>
        <Button
          variant="outline"
          className="border-[#333333] text-white hover:bg-[#1a1a1a] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
));

TrackCard.displayName = 'TrackCard';

export default function WeeklyMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const platforms = useMemo(() => ['all', 'bandcamp', 'soundcloud', 'mixcloud', 'beatport'], []);

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPlatform !== 'all') params.set('platform', selectedPlatform);

      const response = await fetch(`/api/music/weekly?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">Weekly Curated Music</h1>
          <div className="flex gap-2 flex-wrap">
            {platforms.map((platform) => (
              <Button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                variant="outline"
                className={`capitalize transition-all duration-200 ${
                  selectedPlatform === platform
                    ? 'bg-[#D1FF3D] text-black border-[#D1FF3D]'
                    : 'border-[#333333] text-white hover:bg-[#1a1a1a]'
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
            tracks.map((track) => <TrackCard key={track.id} track={track} />)
          )}
        </div>
      </div>
    </div>
  );
}
