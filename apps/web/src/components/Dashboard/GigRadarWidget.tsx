"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink, Ticket } from "lucide-react";
import { SkeletonList } from "@/components/ui/SkeletonCard";

interface Gig {
  id: string;
  title: string;
  venue: string;
  city?: string;
  date: string;
  isTicketed: boolean;
  ticketUrl?: string;
}

interface GigRadarWidgetProps {
  limit?: number;
  className?: string;
}

export function GigRadarWidget({ limit = 3, className = "" }: GigRadarWidgetProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/overview`);
        const data = await response.json();
        
        if (data.gigs) {
          setGigs(data.gigs.slice(0, limit));
        }
      } catch (err) {
        console.error("Failed to fetch gigs:", err);
        setError("Failed to load gigs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGigs();
  }, [limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
        <h2 className="text-white text-xl font-semibold mb-4">Gig Radar</h2>
        <SkeletonList count={limit} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
        <h2 className="text-white text-xl font-semibold mb-4">Gig Radar</h2>
        <p className="text-red-500 text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card className={`bg-[#111111] border-[#1a1a1a] p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-semibold">Gig Radar</h2>
        <Link href="/gigs">
          <Button variant="ghost" size="sm" className="text-[#D7FF3C] hover:text-[#c8f02f] hover:bg-[#1a1a1a]">
            View All
          </Button>
        </Link>
      </div>

      {gigs.length === 0 ? (
        <p className="text-gray-400 text-sm">No upcoming gigs found</p>
      ) : (
        <div className="space-y-3">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="bg-[#0a0a0a] rounded-lg p-4 hover:bg-[#151515] transition-colors border border-[#1a1a1a]"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm mb-2 line-clamp-1">
                    {gig.title}
                  </h3>
                  <div className="flex flex-col gap-1 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {gig.venue}
                        {gig.city && ` • ${gig.city}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>{formatDate(gig.date)}</span>
                    </div>
                  </div>
                </div>
                
                {gig.isTicketed && gig.ticketUrl ? (
                  <Link
                    href={gig.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      className="bg-[#D7FF3C] text-black hover:bg-[#c8f02f] text-xs h-8 px-3"
                    >
                      <Ticket className="h-3 w-3 mr-1" />
                      Book
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-400 border-[#333] hover:bg-[#1a1a1a] text-xs h-8 px-3"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
