"use client";

import { lazy, Suspense, useEffect } from "react";
import { Card } from "@/components/ui/card";
import SpotlightColumn from "@/components/Dashboard/SpotlightColumn";
import { RecentActivity } from "@/components/Dashboard/RecentActivity";
import { markStart, markEnd } from "@/lib/analytics/perf-marks";
import { DashboardContent } from "./dashboard-content";

const TopBanner = lazy(() =>
  import("@/components/Dashboard/TopBanner").then((mod) => ({
    default: mod.TopBanner,
  })),
);

// Mock data for spotlight only
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-[#111111] border-[#1a1a1a] p-6">
            <h2 className="text-white text-xl font-semibold mb-4">
              Recent Activity
            </h2>
            <div className="text-gray-400 text-sm">
              Loading recent activity...
            </div>
          </Card>
        </div>

        {/* Right Column - Spotlight */}
        <div>
          <Card className="bg-[#111111] border-[#1a1a1a] p-6 sticky top-6">
            <h2 className="text-white text-xl font-semibold mb-4">Spotlight</h2>
            <div className="space-y-4">
              {spotlightItems.map((item) => (
                <div key={item.id} className="rounded-lg overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3 bg-[#0a0a0a]">
                    <p className="text-white text-sm font-medium">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Three Card Row: Gig Radar, Community Threads, Latest Mix */}
      <DashboardContent />
    </div>
  );
}