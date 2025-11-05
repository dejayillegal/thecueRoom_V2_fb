"use client";

import { Card } from "./card";

interface SkeletonCardProps {
  className?: string;
  variant?: "default" | "compact" | "wide";
}

export function SkeletonCard({ className = "", variant = "default" }: SkeletonCardProps) {
  const heights = {
    default: "h-48",
    compact: "h-32",
    wide: "h-64",
  };

  return (
    <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-[#1a1a1a] rounded w-3/4"></div>
        <div className="h-3 bg-[#1a1a1a] rounded w-1/2"></div>
        <div className={`${heights[variant]} bg-[#1a1a1a] rounded`}></div>
      </div>
    </Card>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className = "" }: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center space-x-4">
          <div className="h-12 w-12 bg-[#1a1a1a] rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#1a1a1a] rounded w-3/4"></div>
            <div className="h-3 bg-[#1a1a1a] rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
