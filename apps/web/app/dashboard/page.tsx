"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SpotlightCarousel } from "@/components/Dashboard/SpotlightCarousel";
import { GigRadarWidget } from "@/components/Dashboard/GigRadarWidget";
import { TrendingThreadsWidget } from "@/components/Dashboard/TrendingThreadsWidget";
import { MonthlyPlaylistWidget } from "@/components/Dashboard/MonthlyPlaylistWidget";
import { AIToolsBoard } from "@/components/Dashboard/AIToolsBoard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { markStart, markEnd } from "@/lib/analytics/perf-marks";
import type { SpotlightItemProps } from "@/components/Dashboard/SpotlightCarousel";

const TopBanner = lazy(() =>
  import("@/components/Dashboard/TopBanner").then((mod) => ({
    default: mod.TopBanner,
  })),
);

export default function DashboardPage() {
  const [spotlightItems, setSpotlightItems] = useState<SpotlightItemProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    markStart("dashboard-mount");
    markStart("dashboard-render");

    const fetchSpotlight = async () => {
      try {
        const response = await fetch("/api/dashboard/overview");
        const data = await response.json();
        if (data.spotlight) {
          setSpotlightItems(data.spotlight);
        }
      } catch (error) {
        console.error("Failed to fetch spotlight:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpotlight();

    return () => {
      markEnd("dashboard-mount");
    };
  }, []);

  useEffect(() => {
    markEnd("dashboard-render");
  });

  return (
    <ErrorBoundary>
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

        {/* Spotlight Carousel */}
        <div className="mb-8">
          <ErrorBoundary>
            {isLoading ? (
              <SkeletonCard variant="wide" />
            ) : (
              <SpotlightCarousel items={spotlightItems} />
            )}
          </ErrorBoundary>
        </div>

        {/* AI Tools Board */}
        <div className="mb-8">
          <ErrorBoundary>
            <AIToolsBoard />
          </ErrorBoundary>
        </div>

        {/* Three Column Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ErrorBoundary>
            <GigRadarWidget />
          </ErrorBoundary>

          <ErrorBoundary>
            <TrendingThreadsWidget />
          </ErrorBoundary>

          <ErrorBoundary>
            <MonthlyPlaylistWidget />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}