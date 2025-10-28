'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AlertCircle, Sparkles, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface DashboardContentProps {
  user?: {
    email?: string | null;
  } | null;
}

interface FeedItem {
  title: string;
  url: string;
  summary: string;
  image: string;
  publishedAt: string;
  source: string;
  tags: string[];
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [spotlightFeeds, setSpotlightFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchSpotlight = async () => {
      try {
        const res = await fetch('/api/feeds?limit=3', {
          signal: controller.signal,
        });
        const data = await res.json();
        if (mounted && data.data) {
          setSpotlightFeeds(data.data.slice(0, 3));
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch spotlight feeds:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSpotlight();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const gigRadarItems = useMemo(() => [
    { title: 'Fabric London - Techno Night', date: 'Dec 28' },
    { title: 'Printworks Finale', date: 'Jan 5' },
    { title: 'Berghain Showcase', date: 'Jan 12' },
  ], []);

  const curators = useMemo(() => [
    { name: 'Maya', avatar: null },
    { name: 'Jordan', avatar: null },
    { name: 'Sam', avatar: null },
  ], []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <main className="ml-0 lg:ml-[258px] mt-[72px] min-h-screen bg-[#0b0b0b]">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Verification Pending Banner */}
          <div className="lg:col-span-3 bg-[#0f0f0f] rounded-lg p-6 relative overflow-hidden hero-glow">
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-[var(--tcr-accent)] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h2 className="text-[18px] font-semibold text-white mb-2">Verification Pending</h2>
                  <p className="text-[13px] text-[#999999] leading-relaxed max-w-xl">
                    Your artist profile is currently under review. We typically verify accounts within 24-48 hours. 
                    You'll receive an email at <span className="text-white">{user?.email || 'your email'}</span> once approved.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="sm" className="border-[#1a1a1a] hover:bg-[#1a1a1a]">
                  Sign Out
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[var(--tcr-accent)] text-black hover:bg-[var(--tcr-accent)]/90 font-semibold"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Spotlight Card - Wide */}
          <div className="lg:col-span-2 bg-[#0f0f0f] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-[var(--tcr-accent)] flex-shrink-0" size={18} />
              <h3 className="text-[15px] font-semibold">Spotlight</h3>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-[#1a1a1a] rounded animate-pulse" />
                ))}
              </div>
            ) : spotlightFeeds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {spotlightFeeds.map((feed, i) => (
                  <Link
                    key={`${feed.url}-${i}`}
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#222222] transition-colors"
                  >
                    <div className="flex gap-3 p-3">
                      {feed.image && (
                        <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-[#2a2a2a]">
                          <Image
                            src={feed.image}
                            alt={feed.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                            unoptimized={feed.image.startsWith('/api/og-fallback')}
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-white line-clamp-2 group-hover:text-[var(--tcr-accent)] transition-colors mb-1">
                          {feed.title}
                        </div>
                        <div className="text-[11px] text-gray-500">{feed.source}</div>
                        {feed.publishedAt && (
                          <div className="text-[10px] text-gray-600 mt-1">
                            {formatDate(feed.publishedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 leading-relaxed">
                Featured artists and trending tracks will appear here.
              </p>
            )}
          </div>

          {/* Gig Radar */}
          <div className="bg-[#0f0f0f] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-purple-400 flex-shrink-0" size={18} />
              <h3 className="text-[15px] font-semibold">Gig Radar</h3>
            </div>
            <ul className="space-y-3">
              {gigRadarItems.map((item, i) => (
                <li key={i} className="flex justify-between items-start">
                  <span className="text-[13px] text-gray-300">{item.title}</span>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap ml-2">{item.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
          {/* Curators */}
          <div className="bg-[#0f0f0f] rounded-lg p-5">
            <h3 className="text-[15px] font-semibold mb-4">Curators</h3>
            <div className="flex -space-x-2 mb-3">
              {curators.map((curator, i) => (
                <Avatar key={i} className="w-10 h-10 border-2 border-[#0f0f0f]">
                  <AvatarImage src={curator.avatar || undefined} />
                  <AvatarFallback className="bg-[var(--tcr-accent)] text-black text-sm">
                    {curator.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-[11px] text-gray-500">
              {curators.length} active curators
            </p>
          </div>
        </div>

        <div className="mt-6 text-right">
          <p className="text-[11px] text-gray-600">Private beta</p>
        </div>
      </div>
    </main>
  );
}