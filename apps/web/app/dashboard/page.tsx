"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { markStart, markEnd } from "@/lib/analytics/perf-marks";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";

const TopBanner = lazy(() =>
  import("@/components/Dashboard/TopBanner").then((mod) => ({
    default: mod.TopBanner,
  })),
);

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    markStart("dashboard-mount");
    markStart("dashboard-render");

    const fetchOverview = async () => {
      try {
        const response = await fetch("/api/dashboard/overview", { cache: 'no-store' });
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();

    return () => {
      markEnd("dashboard-mount");
    };
  }, []);

  useEffect(() => {
    markEnd("dashboard-render");
  });

  return (
    <ErrorBoundary>
      <div className="max-w-[1400px] mx-auto p-6 space-y-12 pb-24">
        {/* Top Banner */}
        <Suspense
          fallback={
            <div className="h-24 bg-white/5 rounded-2xl animate-pulse backdrop-blur-md" />
          }
        >
          <div className="transform transition-all hover:scale-[1.002] will-change-transform shadow-2xl shadow-purple-500/5">
            <TopBanner />
          </div>
        </Suspense>

        {isLoading ? (
          <div className="space-y-12">
            <SkeletonCard variant="wide" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : (
          <DashboardContent data={dashboardData} />
        )}
      </div>
    </ErrorBoundary>
  );
}
