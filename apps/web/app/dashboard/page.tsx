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
        const response = await fetch("/api/dashboard/overview", { cache: 'no-store' });
        const data = await response.json();
        console.log("Dashboard data fetched:", data);
        if (data.spotlight && data.spotlight.length > 0) {
          setSpotlightItems(data.spotlight);
        } else if (data.trendingThreads) {
          // Fallback if spotlight is empty but we have news
          const fallbackItems = data.trendingThreads.slice(0, 5).map((thread: any) => ({
            id: thread.id,
            title: thread.title,
            subtitle: thread.category || "Community Discussion",
            imageUrl: "/api/og-fallback?title=" + encodeURIComponent(thread.title),
            link: "/forum/thread/" + thread.id,
            tag: "Trending"
          }));
          setSpotlightItems(fallbackItems);
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
      <div className="max-w-[1400px] mx-auto p-6 space-y-10">
        {/* Top Banner - Replacing the redundant header with the dynamic banner */}
        <Suspense
          fallback={
            <div className="h-24 bg-white/5 rounded-2xl animate-pulse backdrop-blur-md" />
          }
        >
          <div className="transform transition-all hover:scale-[1.002] will-change-transform">
            <TopBanner />
          </div>
        </Suspense>

        <div className="grid grid-cols-1 gap-12">
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#D7FF3C] rounded-full shadow-[0_0_10px_rgba(215,255,60,0.3)]" />
              <h2 className="text-white text-xl font-black uppercase tracking-[0.2em] text-sm opacity-80">Creative Suite</h2>
            </div>
            <div className="rounded-[32px] p-px bg-gradient-to-br from-white/10 via-transparent to-transparent">
              <div className="bg-[#0B0B0B] rounded-[31px] overflow-hidden">
                <ErrorBoundary>
                  <AIToolsBoard />
                </ErrorBoundary>
              </div>
            </div>
          </section>

          {/* Three Column Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 will-change-transform">
            <section className="space-y-6">
              <ErrorBoundary>
                <GigRadarWidget />
              </ErrorBoundary>
            </section>

            <section className="space-y-6">
              <ErrorBoundary>
                <TrendingThreadsWidget />
              </ErrorBoundary>
            </section>

            <section className="space-y-6">
              <ErrorBoundary>
                <MonthlyPlaylistWidget />
              </ErrorBoundary>
            </section>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}