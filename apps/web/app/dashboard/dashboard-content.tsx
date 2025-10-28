'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { AlertCircle, Sparkles, Calendar } from 'lucide-react';

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

const gigRadarItems = [
  { title: 'Fabric London - Techno Night', date: 'Dec 28' },
  { title: 'Printworks Finale', date: 'Jan 5' },
  { title: 'Berghain Showcase', date: 'Jan 12' },
];

export const DashboardContent = memo(function DashboardContent({ user }: DashboardContentProps) {
  const [spotlightFeeds, setSpotlightFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchSpotlight = async () => {
      try {
        const res = await fetch('/api/feeds?limit=3', {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch');

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

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
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
          {/* Spotlight Card - Wide with Vertical Autoscroll */}
          <div className="lg:col-span-2 bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[var(--tcr-accent)] flex-shrink-0" size={18} />
                <h3 className="text-[15px] font-semibold">Spotlight</h3>
              </div>
              <div className="w-2 h-2 rounded-full bg-[var(--tcr-accent)] animate-pulse"></div>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-[#1a1a1a] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : spotlightFeeds.length > 0 ? (
              <div className="relative h-[400px] overflow-hidden">
                <div className="spotlight-scroll-container space-y-3 h-full overflow-y-auto scrollbar-hide">
                  {spotlightFeeds.map((feed, i) => (
                    <Link
                      key={`${feed.url}-${i}`}
                      href={feed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-lg overflow-hidden hover:from-[#222222] hover:to-[#1a1a1a] transition-colors duration-200 border border-[#2a2a2a] hover:border-[var(--tcr-accent)]/30"
                    >
                      <div className="flex gap-4 p-4">
                        {feed.image && (
                          <div className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-[#2a2a2a] ring-1 ring-white/5">
                            <Image
                              src={feed.image}
                              alt={feed.title}
                              fill
                              sizes="112px"
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              unoptimized={feed.image.startsWith('/api/og-fallback')}
                              loading="lazy"
                              quality={75}
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="text-[14px] font-semibold text-white line-clamp-2 group-hover:text-[var(--tcr-accent)] transition-colors duration-200 leading-snug mb-2">
                              {feed.title}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span className="px-2 py-0.5 bg-[var(--tcr-accent)]/10 text-[var(--tcr-accent)] rounded-full font-medium">
                                {feed.source}
                              </span>
                              {feed.publishedAt && (
                                <span className="text-gray-600">
                                  {formatDate(feed.publishedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          {feed.tags && feed.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {feed.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 text-[10px] bg-[#2a2a2a] text-gray-400 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0f0f0f] to-transparent pointer-events-none" />
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

        {/* SoundCloud Player - Full Width */}
        <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <h3 className="text-[15px] font-semibold mb-4">Latest Mix</h3>
          <div className="rounded-lg overflow-hidden bg-[#1a1a1a]">
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1677969130&color=%23D1FF3D&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"
              title="SoundCloud player"
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 text-right">
          <p className="text-[11px] text-gray-600">Private beta</p>
        </div>
      </div>
    </div>
  );
});