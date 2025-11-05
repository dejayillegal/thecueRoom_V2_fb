"use client";

import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SpotlightCarousel } from "@/components/Dashboard/SpotlightCarousel";
import { GigRadarWidget } from "@/components/Dashboard/GigRadarWidget";
import { TrendingThreadsWidget } from "@/components/Dashboard/TrendingThreadsWidget";
import { MonthlyPlaylistWidget } from "@/components/Dashboard/MonthlyPlaylistWidget";
import { AIToolsBoard } from "@/components/Dashboard/AIToolsBoard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { markStart, markEnd } from "@/lib/analytics/perf-marks";
import type { SpotlightItemProps } from "@/components/Dashboard/SpotlightCarousel";

export default function DashboardPage() {
  const [spotlightItems, setSpotlightItems] = useState<SpotlightItemProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchSpotlight = async () => {
      try {
        const response = await fetch("/api/admin/spotlight", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            setSpotlightItems(data.items);
          }
        }
      } catch (error) {
        console.error("Failed to fetch spotlight items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpotlight();

    // Refresh data every 5 minutes for real-time updates
    const interval = setInterval(fetchSpotlight, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm">Your music industry hub</p>
        </div>

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

        {/* Three Column Widgets Grid - Fixed alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
          <div className="h-full">
            <ErrorBoundary>
              <GigRadarWidget />
            </ErrorBoundary>
          </div>

          <div className="h-full">
            <ErrorBoundary>
              <TrendingThreadsWidget />
            </ErrorBoundary>
          </div>

          <div className="h-full">
            <ErrorBoundary>
              <MonthlyPlaylistWidget />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}