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
      <div className="max-w-[1400px] mx-auto p-6 space-y-8">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B0B0B] to-[#1A1A1A] p-8 border border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9B5CFF]/10 blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D7FF3C]/5 blur-[100px] -ml-32 -mb-32" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Dashboard
            </h1>
            <p className="text-gray-400 text-base font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D7FF3C] animate-pulse" />
              Your music industry hub
            </p>
          </div>
        </header>

        {/* Top Banner */}
        <Suspense
          fallback={
            <div className="h-24 bg-white/5 rounded-2xl animate-pulse backdrop-blur-md" />
          }
        >
          <div className="transform transition-all hover:scale-[1.005]">
            <TopBanner />
          </div>
        </Suspense>

        <div className="grid grid-cols-1 gap-10">
          {/* Spotlight Carousel */}
          <section className="relative group will-change-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-[#9B5CFF] rounded-full" />
              <h2 className="text-xl font-bold text-white/90 uppercase tracking-widest text-sm">Featured Spotlight</h2>
            </div>
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-[#9B5CFF]/30 will-change-[border-color]">
              <ErrorBoundary>
                {isLoading ? (
                  <SkeletonCard variant="wide" />
                ) : (
                  <SpotlightCarousel items={spotlightItems} />
                )}
              </ErrorBoundary>
            </div>
          </section>

          {/* AI Tools Board */}
          <section className="will-change-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-[#D7FF3C] rounded-full" />
              <h2 className="text-xl font-bold text-white/90 uppercase tracking-widest text-sm">Creative Suite</h2>
            </div>
            <div className="rounded-3xl p-1 bg-gradient-to-br from-white/10 to-transparent">
              <div className="bg-[#0B0B0B] rounded-[22px] overflow-hidden">
                <ErrorBoundary>
                  <AIToolsBoard />
                </ErrorBoundary>
              </div>
            </div>
          </section>

          {/* Three Column Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 will-change-transform">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Radar</h3>
                <span className="text-[10px] bg-[#D7FF3C]/10 text-[#D7FF3C] px-2 py-0.5 rounded-full font-bold">LIVE</span>
              </div>
              <div className="bg-[#111] rounded-2xl border border-white/5 p-1 transition-all hover:border-white/10">
                <ErrorBoundary>
                  <GigRadarWidget />
                </ErrorBoundary>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Trending Conversations</h3>
              <div className="bg-[#111] rounded-2xl border border-white/5 p-1 transition-all hover:border-white/10">
                <ErrorBoundary>
                  <TrendingThreadsWidget />
                </ErrorBoundary>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Weekly Selects</h3>
              <div className="bg-[#111] rounded-2xl border border-white/5 p-1 transition-all hover:border-white/10">
                <ErrorBoundary>
                  <MonthlyPlaylistWidget />
                </ErrorBoundary>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}