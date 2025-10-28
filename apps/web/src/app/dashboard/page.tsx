
'use client';

import { lazy, Suspense } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { SpotlightColumn } from '@/components/Dashboard/SpotlightColumn';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';
import { GigRadar } from '@/components/Dashboard/GigRadar';

const TopBanner = lazy(() =>
  import('@/components/Dashboard/TopBanner').then((mod) => ({ default: mod.TopBanner }))
);

// Mock data
const spotlightItems = [
  {
    id: '1',
    title: 'New Techno Release',
    image: '/api/og-fallback?title=Techno',
    url: '#',
  },
  {
    id: '2',
    title: 'House Music Festival',
    image: '/api/og-fallback?title=House',
    url: '#',
  },
  {
    id: '3',
    title: 'Underground Interview',
    image: '/api/og-fallback?title=Interview',
    url: '#',
  },
];

const activities = Array.from({ length: 50 }, (_, i) => ({
  id: `activity-${i}`,
  type: 'release',
  title: `Activity ${i + 1}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
}));

const gigs = Array.from({ length: 15 }, (_, i) => ({
  id: `gig-${i}`,
  title: `Gig ${i + 1}`,
  venue: `Venue ${i + 1}`,
  date: new Date(Date.now() + i * 86400000).toLocaleDateString(),
}));

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-[#1a1a1a]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome to thecueRoom</h1>
            <p className="text-gray-400">Your music industry hub</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Banner */}
        <Suspense fallback={<div className="h-24 bg-[#111111] rounded-lg animate-pulse" />}>
          <TopBanner />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card className="bg-[#111111] border-[#1a1a1a] p-6">
              <h2 className="text-white text-xl font-semibold mb-4">Recent Activity</h2>
              <RecentActivity activities={activities} />
            </Card>

            {/* Gig Radar */}
            <Card className="bg-[#111111] border-[#1a1a1a] p-6">
              <h2 className="text-white text-xl font-semibold mb-4">Gig Radar</h2>
              <GigRadar gigs={gigs} />
            </Card>
          </div>

          {/* Right Column - Spotlight */}
          <div>
            <Card className="bg-[#111111] border-[#1a1a1a] p-6 sticky top-6">
              <h2 className="text-white text-xl font-semibold mb-4">Spotlight</h2>
              <SpotlightColumn items={spotlightItems} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
