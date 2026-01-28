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
import { motion } from "framer-motion";

const TopBanner = lazy(() =>
  import("@/components/Dashboard/TopBanner").then((mod) => ({
    default: mod.TopBanner,
  })),
);

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

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
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1400px] mx-auto p-6 space-y-12 relative"
      >
        {/* Ambient Background Elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#9B5CFF]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D7FF3C]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        {/* Top Banner */}
        <motion.div variants={item}>
          <Suspense
            fallback={
              <div className="h-24 bg-white/5 rounded-2xl animate-pulse backdrop-blur-md" />
            }
          >
            <div className="transform transition-all hover:scale-[1.002] will-change-transform shadow-2xl shadow-purple-500/5">
              <TopBanner />
            </div>
          </Suspense>
        </motion.div>

        <div className="grid grid-cols-1 gap-16">
          {/* Spotlight Carousel */}
          <motion.section variants={item} className="relative group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#9B5CFF] rounded-full shadow-[0_0_15px_rgba(155,92,255,0.4)]" />
              <h2 className="text-xl font-black text-white/90 uppercase tracking-[0.2em] text-sm">Featured Spotlight</h2>
            </div>
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-[#9B5CFF]/30 ring-1 ring-white/5">
              <ErrorBoundary>
                {isLoading ? (
                  <SkeletonCard variant="wide" />
                ) : (
                  <div className="relative">
                    <SpotlightCarousel items={spotlightItems} />
                    {/* Visual Overlay for depth */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </motion.section>

          {/* AI Tools Board */}
          <motion.section variants={item}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#D7FF3C] rounded-full shadow-[0_0_15px_rgba(215,255,60,0.4)]" />
              <h2 className="text-white text-xl font-black uppercase tracking-[0.2em] text-sm opacity-90">Creative Suite</h2>
            </div>
            <div className="rounded-[40px] p-px bg-gradient-to-br from-white/15 via-white/5 to-transparent shadow-2xl">
              <div className="bg-[#0B0B0B]/80 backdrop-blur-sm rounded-[39px] overflow-hidden border border-white/5">
                <ErrorBoundary>
                  <AIToolsBoard />
                </ErrorBoundary>
              </div>
            </div>
          </motion.section>

          {/* Three Column Widgets Grid */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <section className="space-y-6 relative group">
              <div className="absolute -inset-4 bg-[#9B5CFF]/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
              <ErrorBoundary>
                <GigRadarWidget />
              </ErrorBoundary>
            </section>

            <section className="space-y-6 relative group">
              <div className="absolute -inset-4 bg-white/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
              <ErrorBoundary>
                <TrendingThreadsWidget />
              </ErrorBoundary>
            </section>

            <section className="space-y-6 relative group">
              <div className="absolute -inset-4 bg-[#D7FF3C]/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
              <ErrorBoundary>
                <MonthlyPlaylistWidget />
              </ErrorBoundary>
            </section>
          </motion.div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}