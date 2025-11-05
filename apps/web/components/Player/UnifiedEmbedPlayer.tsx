
'use client';

import { useState } from 'react';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnifiedEmbedPlayerProps {
  platform: 'spotify' | 'soundcloud' | 'mixcloud';
  url?: string;
  embedUrl?: string;
  playlistId?: string;
  title?: string;
  coverImage?: string;
  trackCount?: number;
  className?: string;
  height?: number;
  showExternalButton?: boolean;
}

export function UnifiedEmbedPlayer({
  platform,
  url,
  embedUrl,
  playlistId,
  title = 'Playlist',
  coverImage,
  trackCount,
  className = '',
  height = 380,
  showExternalButton = true,
}: UnifiedEmbedPlayerProps) {
  const [embedFailed, setEmbedFailed] = useState(false);

  const getEmbedUrl = (): string | null => {
    if (embedUrl) return embedUrl;

    switch (platform) {
      case 'spotify':
        if (playlistId) {
          return `https://open.spotify.com/embed/playlist/${playlistId}`;
        }
        break;
      case 'soundcloud':
        if (playlistId) {
          return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/${playlistId}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
        }
        break;
      case 'mixcloud':
        if (playlistId) {
          return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(playlistId)}`;
        }
        break;
    }
    return null;
  };

  const getExternalUrl = (): string => {
    if (url) return url;

    switch (platform) {
      case 'spotify':
        if (playlistId) {
          return `https://open.spotify.com/playlist/${playlistId}`;
        }
        break;
      case 'soundcloud':
        if (playlistId) {
          return `https://soundcloud.com/${playlistId}`;
        }
        break;
      case 'mixcloud':
        if (playlistId) {
          return `https://www.mixcloud.com/${playlistId}`;
        }
        break;
    }
    return '#';
  };

  const getDeepLink = (): string => {
    // Mobile deep links for native app opening
    switch (platform) {
      case 'spotify':
        if (playlistId) {
          return `spotify:playlist:${playlistId}`;
        }
        break;
      case 'soundcloud':
      case 'mixcloud':
        return getExternalUrl();
    }
    return getExternalUrl();
  };

  const handleOpenExternal = () => {
    const externalUrl = getExternalUrl();
    const deepLink = getDeepLink();

    // Try deep link first on mobile, fallback to web
    if (typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.location.href = deepLink;
      // Fallback to web after a short delay if app didn't open
      setTimeout(() => {
        window.open(externalUrl, '_blank', 'noopener,noreferrer');
      }, 1500);
    } else {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const finalEmbedUrl = getEmbedUrl();

  if (embedFailed || !finalEmbedUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-neutral-900 rounded-lg p-8 ${className}`}
        style={{ height }}
      >
        {coverImage && (
          <img
            src={coverImage}
            alt={title}
            className="w-32 h-32 rounded-lg mb-4 object-cover"
          />
        )}
        <p className="text-white font-semibold mb-2">{title}</p>
        {trackCount !== undefined && (
          <p className="text-neutral-400 text-sm mb-4">{trackCount} tracks</p>
        )}
        <p className="text-neutral-400 mb-4 text-center">
          {embedFailed ? 'Unable to load embed player' : 'Embed preview not available'}
        </p>
        <Button
          onClick={handleOpenExternal}
          className="bg-lime-500 hover:bg-lime-600 text-black"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Open in {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={finalEmbedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={title}
        className="rounded-lg"
        onError={() => setEmbedFailed(true)}
      />
      {showExternalButton && (
        <div className="mt-3 flex justify-center">
          <Button
            onClick={handleOpenExternal}
            variant="outline"
            className="border-neutral-700 text-white hover:bg-neutral-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in {platform.charAt(0).toUpperCase() + platform.slice(1)} App
          </Button>
        </div>
      )}
    </div>
  );
}
