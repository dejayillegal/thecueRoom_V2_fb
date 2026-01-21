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
        const response = await fetch(`/api/dashboard/overview`, { cache: "no-store" });
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
    
    // Refresh gigs every 3 minutes
    const interval = setInterval(fetchGigs, 3 * 60 * 1000);
    
    return () => clearInterval(interval);
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
    <Card className={`bg-[#111] border-white/5 p-8 h-full flex flex-col relative overflow-hidden group/radar ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#D7FF3C]/2 to-transparent opacity-0 group-hover/radar:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#D7FF3C] rounded-full shadow-[0_0_10px_rgba(215,255,60,0.5)]" />
            Gig Radar
          </h2>
          <Link href="/gigs">
            <Button variant="ghost" size="sm" className="text-[#D7FF3C] hover:text-[#c8f02f] hover:bg-white/5 font-bold text-[11px] uppercase tracking-widest">
              View All
            </Button>
          </Link>
        </div>

        {gigs.length === 0 ? (
          <p className="text-gray-400 text-sm font-medium italic">No upcoming gigs found</p>
        ) : (
          <div className="space-y-4 flex-1">
            {gigs.map((gig) => (
              <div
                key={gig.id}
                className="bg-black/40 backdrop-blur-sm rounded-xl p-5 hover:bg-[#151515] transition-all duration-300 border border-white/5 hover:border-[#D7FF3C]/20 group/gig"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm mb-3 line-clamp-1 group-hover/gig:text-[#D7FF3C] transition-colors tracking-tight">
                      {gig.title}
                    </h3>
                    <div className="flex flex-col gap-2 text-[11px] text-gray-500 font-medium">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-3.5 w-3.5 text-[#D7FF3C]/70" />
                        <span className="line-clamp-1">
                          {gig.venue}
                          {gig.city && ` • ${gig.city}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-3.5 w-3.5 text-[#9B5CFF]/70" />
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
                        className="bg-[#D7FF3C] text-black hover:bg-[#c8f02f] text-[10px] font-black uppercase tracking-tighter h-9 px-4 rounded-lg shadow-lg hover:shadow-[#D7FF3C]/20"
                      >
                        <Ticket className="h-3.5 w-3.5 mr-1.5" />
                        Book
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-400 border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest h-9 px-4 rounded-lg"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Info
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
