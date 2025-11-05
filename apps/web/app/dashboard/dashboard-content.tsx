
'use client';

import { useEffect, useState } from 'react';
import { Calendar, MessageSquare, Music } from 'lucide-react';
import Link from 'next/link';

interface Gig {
  id: string;
  title: string;
  venue: string;
  date: string;
  ticketUrl?: string;
}

interface Thread {
  id: string;
  title: string;
  replyCount: number;
  likesCount: number;
}

interface Playlist {
  id: string;
  title: string;
  embedUrl?: string;
  platform: string;
  platformId?: string;
}

const gigRadarItems = [
  { id: '1', title: 'Fabric London - Techno Night', venue: 'Fabric', date: 'Dec 28', ticketUrl: '#' },
  { id: '2', title: 'Printworks Finale', venue: 'Printworks', date: 'Jan 5', ticketUrl: '#' },
  { id: '3', title: 'Berghain Showcase', venue: 'Berghain', date: 'Jan 12', ticketUrl: '#' },
  { id: '4', title: 'Warehouse Project Manchester', venue: 'Depot Mayfield', date: 'Jan 19', ticketUrl: '#' },
  { id: '5', title: 'Output Brooklyn', venue: 'Output', date: 'Jan 26', ticketUrl: '#' },
];

export function DashboardContent() {
  const [gigs, setGigs] = useState<Gig[]>(gigRadarItems);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  // Fetch real gigs
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await fetch('/api/gigs/india?limit=10');
        const data = await res.json();
        if (data.ok && data.events?.length > 0) {
          const formattedGigs = data.events.slice(0, 5).map((event: any) => ({
            id: event.id,
            title: event.title,
            venue: event.venue || event.city,
            date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ticketUrl: event.ticketUrl || event.url,
          }));
          setGigs(formattedGigs);
        }
      } catch (error) {
        console.error('Failed to fetch gigs:', error);
      }
    };

    fetchGigs();
  }, []);

  // Auto-scroll gigs
  useEffect(() => {
    if (gigs.length <= 3) return;

    const interval = setInterval(() => {
      setScrollPosition((prev) => (prev + 1) % gigs.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [gigs.length]);

  // Fetch trending threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch('/api/forum/thread?sort=trending&limit=5');
        const data = await res.json();
        if (data.threads?.length > 0) {
          setThreads(data.threads.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch threads:', error);
      }
    };

    fetchThreads();
  }, []);

  // Fetch latest monthly playlist
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await fetch('/api/playlists/monthly/latest');
        const data = await res.json();
        if (data.ok && data.playlists?.length > 0) {
          setPlaylist(data.playlists[0]);
        }
      } catch (error) {
        console.error('Failed to fetch playlist:', error);
      }
    };

    fetchPlaylist();
  }, []);

  const getVisibleGigs = () => {
    if (gigs.length <= 3) return gigs;
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(gigs[(scrollPosition + i) % gigs.length]);
    }
    return visible;
  };

  const getEmbedUrl = () => {
    if (!playlist) return null;
    if (playlist.embedUrl) return playlist.embedUrl;
    
    if (playlist.platform === 'spotify' && playlist.platformId) {
      return `https://open.spotify.com/embed/playlist/${playlist.platformId}`;
    }
    if (playlist.platform === 'soundcloud' && playlist.platformId) {
      return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/${playlist.platformId}&color=%23D1FF3D&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
      {/* Gig Radar */}
      <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-purple-400 flex-shrink-0" size={18} />
          <h3 className="text-[15px] font-semibold">Gig Radar</h3>
        </div>
        <ul className="space-y-3">
          {getVisibleGigs().map((item) => (
            <li key={item.id} className="flex justify-between items-start">
              {item.ticketUrl ? (
                <a
                  href={item.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-gray-300 hover:text-[#D1FF3D] transition-colors flex-1"
                >
                  {item.title}
                </a>
              ) : (
                <span className="text-[13px] text-gray-300 flex-1">{item.title}</span>
              )}
              <span className="text-[11px] text-gray-500 whitespace-nowrap ml-2">{item.date}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/gigs/india"
          className="mt-4 block text-center text-xs text-[#D1FF3D] hover:text-[#e7ff6f] transition-colors"
        >
          View All Gigs →
        </Link>
      </div>

      {/* Community Threads */}
      <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="text-blue-400 flex-shrink-0" size={18} />
          <h3 className="text-[15px] font-semibold">Trending Threads</h3>
        </div>
        {threads.length > 0 ? (
          <ul className="space-y-3">
            {threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={`/community/thread/${thread.id}`}
                  className="block group"
                >
                  <div className="text-[13px] text-gray-300 group-hover:text-[#D1FF3D] transition-colors line-clamp-2">
                    {thread.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-gray-500">
                      {thread.replyCount} replies
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {thread.likesCount} likes
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-gray-500">No threads yet</p>
        )}
        <Link
          href="/community/forum"
          className="mt-4 block text-center text-xs text-[#D1FF3D] hover:text-[#e7ff6f] transition-colors"
        >
          View Forum →
        </Link>
      </div>

      {/* Latest Mix - Monthly Playlist */}
      <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-4">
          <Music className="text-green-400 flex-shrink-0" size={18} />
          <h3 className="text-[15px] font-semibold">
            {playlist ? playlist.title : 'Latest Mix'}
          </h3>
        </div>
        <div className="rounded-lg overflow-hidden bg-[#1a1a1a]">
          {embedUrl ? (
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={embedUrl}
              title="Monthly Playlist"
              className="w-full"
            />
          ) : (
            <div className="h-[166px] flex items-center justify-center text-gray-500 text-sm">
              Loading playlist...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
