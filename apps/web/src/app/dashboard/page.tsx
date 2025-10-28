
'use client';

import { lazy, Suspense } from 'react';
import { SpotlightColumn } from '@/components/Dashboard/SpotlightColumn';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';
import { GigRadar } from '@/components/Dashboard/GigRadar';
import { Card } from '@/components/ui/card';

const TopBanner = lazy(() =>
  import('@/components/Dashboard/TopBanner').then((mod) => ({ default: mod.TopBanner }))
);

// Mock data (replace with API calls)
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

/**
 * Optimized Dashboard page with lazy loading and virtualization
 */
export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<div className="h-24 bg-[#111111] rounded-lg animate-pulse" />}>
        <TopBanner />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity activities={activities} />
          <GigRadar gigs={gigs} />
        </div>

        <div>
          <Card className="bg-[#111111] border-[#1a1a1a] p-4">
            <h2 className="text-white font-semibold mb-4">Spotlight</h2>
            <SpotlightColumn items={spotlightItems} />
          </Card>
        </div>
      </div>
    </div>
  );
}
