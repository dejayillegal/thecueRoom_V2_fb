"use client";

import { lazy, Suspense, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { SpotlightColumn } from "@/components/Dashboard/SpotlightColumn";
import { RecentActivity } from "@/components/Dashboard/RecentActivity";
import { GigRadar } from "@/components/Dashboard/GigRadar";
import { markStart, markEnd } from "@/lib/analytics/perf-marks";
import { DashboardContent } from "./dashboard-content";

const TopBanner = lazy(() =>
  import("@/components/Dashboard/TopBanner").then((mod) => ({
    default: mod.TopBanner,
  })),
);

// Mock data
const spotlightItems = [
  {
    id: "1",
    title: "New Techno Release",
    image: "/api/og-fallback?title=Techno",
    url: "#",
  },
  {
    id: "2",
    title: "House Music Festival",
    image: "/api/og-fallback?title=House",
    url: "#",
  },
  {
    id: "3",
    title: "Underground Interview",
    image: "/api/og-fallback?title=Interview",
    url: "#",
  },
];

const activities = Array.from({ length: 50 }, (_, i) => ({
  id: `activity-${i}`,
  type: "release",
  title: `Activity ${i + 1}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
}));

const gigs = Array.from({ length: 15 }, (_, i) => ({
  id: `gig-${i}`,
  title: `Gig ${i + 1}`,
  venue: `Venue ${i + 1}`,
  date: new Date(Date.now() + i * 86400000).toLocaleDateString(),
}));

// Mock data for Community Threads
const threads = Array.from({ length: 10 }, (_, i) => ({
  id: `thread-${i}`,
  title: `Trending Thread ${i + 1}`,
  forum: `Forum ${i % 3 + 1}`,
  replies: Math.floor(Math.random() * 100),
  timestamp: new Date(Date.now() - i * 7200000).toLocaleTimeString(),
}));


export default function DashboardPage() {
  useEffect(() => {
    markStart("dashboard-mount");
    markStart("dashboard-render");

    return () => {
      markEnd("dashboard-mount");
    };
  }, []);

  useEffect(() => {
    markEnd("dashboard-render");
  });

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400 text-sm">Your music industry hub</p>
      </div>

      {/* Top Banner */}
      <Suspense
        fallback={
          <div className="h-24 bg-[#111111] rounded-lg animate-pulse mb-6" />
        }
      >
        <div className="mb-6">
          <TopBanner />
        </div>
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <Card className="bg-[#111111] border-[#1a1a1a] p-6">
            <h2 className="text-white text-xl font-semibold mb-4">
              Recent Activity
            </h2>
            <RecentActivity activities={activities} />
          </Card>

          {/* Gig Radar */}
          <Card className="bg-[#111111] border-[#1a1a1a] p-6">
            <h2 className="text-white text-xl font-semibold mb-4">Gig Radar</h2>
            {/* Assuming GigRadar component will handle the auto-scroll and clickable gigs */}
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

      {/* Three Card Row: Gig Radar, Community Threads, Latest Mix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {/* Gig Radar Card (moved from left column for better layout) */}
        <Card className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-calendar text-purple-400 flex-shrink-0"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
            <h3 className="text-[15px] font-semibold text-white">Gig Radar</h3>
          </div>
          <ul className="space-y-3">
            {gigs.map((gig) => (
              <li key={gig.id} className="flex justify-between items-start cursor-pointer hover:bg-[#1a1a1a] p-1 rounded">
                <span className="text-[13px] text-gray-300">{gig.title}</span>
                <span className="text-[11px] text-gray-500 whitespace-nowrap ml-2">{gig.date}</span>
              </li>
            ))}
          </ul>
          {/* Placeholder for auto-scroll functionality */}
        </Card>

        {/* Community Threads Card */}
        <Card className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-square-text text-green-400 flex-shrink-0"><path d="M15 21v-1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1"></path><path d="M8 17v1"></path><path d="M12 17v1"></path><path d="M16 17v1"></path><path d="M19 13a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1"></path><path d="M22 7.5a2.5 2.5 0 0 0-3-2.5"></path><path d="M22 12a.5.5 0 0 1-.5.5H20v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5.5H17v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5.5H13v1.5a.5.5 0 0 1-1 0V21"></path></svg>
            <h3 className="text-[15px] font-semibold text-white">Community Threads</h3>
          </div>
          <ul className="space-y-3">
            {threads.map((thread) => (
              <li key={thread.id} className="flex justify-between items-start cursor-pointer hover:bg-[#1a1a1a] p-1 rounded">
                <span className="text-[13px] text-gray-300">{thread.title}</span>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-gray-500 whitespace-nowrap ml-2">{thread.forum}</span>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap ml-2">{thread.replies} replies</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Latest Mix Card */}
        <Card className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <h3 className="text-[15px] font-semibold mb-4 text-white">Latest Mix</h3>
          <div className="rounded-lg overflow-hidden bg-[#1a1a1a]">
            {/* Replace with actual monthly curated music embed */}
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameborder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1677969130&amp;color=%23D1FF3D&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=true&amp;show_reposts=false&amp;show_teaser=false"
              title="SoundCloud player"
              className="w-full"
            ></iframe>
          </div>
        </Card>
      </div>
    </div>
  );
}