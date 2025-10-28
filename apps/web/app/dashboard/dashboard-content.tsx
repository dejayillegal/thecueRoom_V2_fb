

'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle, Sparkles, Calendar } from 'lucide-react';
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
    const fetchSpotlight = async () => {
      try {
        const res = await fetch('/api/feeds?limit=3');
        const data = await res.json();
        if (data.data) {
          setSpotlightFeeds(data.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch spotlight feeds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpotlight();
  }, []);

  const gigRadarItems = [
    { title: 'Fabric London - Techno Night', date: 'Dec 28' },
    { title: 'Printworks Finale', date: 'Jan 5' },
    { title: 'Berghain Showcase', date: 'Jan 12' },
  ];

  const recentActivity = [
    {
      user: 'Alex Chen',
      action: 'submitted new track',
      time: '2 hours ago',
      avatar: null,
    },
    {
      user: 'DJ Shadow',
      action: 'updated gig listing',
      time: '5 hours ago',
      avatar: null,
    },
  ];

  const curators = [
    { name: 'Maya', avatar: null },
    { name: 'Jordan', avatar: null },
    { name: 'Sam', avatar: null },
  ];

  return (
    <main className="ml-0 lg:ml-[258px] mt-[72px] min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Verification Pending Banner */}
          <div className="lg:col-span-2 bg-[#0f0f0f] rounded-lg p-6 relative overflow-hidden hero-glow">
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-[var(--tcr-accent)] mt-1" size={20} />
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

          {/* Verification Status */}
          <div className="bg-[#0f0f0f] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-orange-400" size={18} />
              <h3 className="text-[15px] font-semibold">Verification Status</h3>
            </div>
            <p className="text-[13px] text-gray-400 mb-3">Under review</p>
            <div className="text-[11px] text-gray-500">
              Estimated: 24-48 hours
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Spotlight Card */}
          <div className="bg-[#0f0f0f] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-[var(--tcr-accent)]" size={18} />
              <h3 className="text-[15px] font-semibold">Spotlight</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-[#1a1a1a] rounded animate-pulse" />
                ))}
              </div>
            ) : spotlightFeeds.length > 0 ? (
              <div className="space-y-3">
                {spotlightFeeds.map((feed, i) => (
                  <Link
                    key={i}
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex gap-2">
                      {feed.image && (
                        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                          <Image
                            src={feed.image}
                            alt={feed.title}
                            fill
                            className="object-cover"
                            unoptimized={feed.image.startsWith('/api/og-fallback')}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-white line-clamp-2 group-hover:text-[var(--tcr-accent)] transition-colors">
                          {feed.title}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">{feed.source}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 leading-relaxed">
                Featured artists and trending tracks will appear here once your profile is verified.
              </p>
            )}
          </div>

          {/* Gig Radar */}
          <div className="bg-[#0f0f0f] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-purple-400" size={18} />
              <h3 className="text-[15px] font-semibold">Gig Radar</h3>
            </div>
            <ul className="space-y-3">
              {gigRadarItems.map((item, i) => (
                <li key={i} className="flex justify-between items-start">
                  <span className="text-[13px] text-gray-300">{item.title}</span>
                  <span className="text-[11px] text-gray-500">{item.date}</span>
                </li>
              ))}
            </ul>
          </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
          {/* Recent Activity */}
          <div className="bg-[#0f0f0f] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Recent Activity</h3>
              <div className="animate-spin">
                <div className="w-4 h-4 border-2 border-[var(--tcr-accent)] border-t-transparent rounded-full" />
              </div>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.avatar || undefined} />
                    <AvatarFallback className="bg-[var(--tcr-accent)] text-black text-xs">
                      {activity.user[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] text-white">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-[11px] text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <p className="text-[11px] text-gray-600">Private beta</p>
        </div>
      </div>
    </main>
  );
}

