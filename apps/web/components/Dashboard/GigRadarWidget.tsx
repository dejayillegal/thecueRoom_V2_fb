"use client";

import { Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export function GigRadarWidget() {
  return (
    <Card className="bg-[#111111]/40 border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md h-full min-h-[400px]">
      <div className="p-8 border-b border-white/5 flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Gig Radar</h3>
          <p className="text-[10px] text-zinc-500 font-mono">Live Signal Tracking</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
      </div>

      <div className="flex flex-col items-center justify-center p-12 text-center h-[300px] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#D7FF3C]/20 blur-2xl rounded-full" />
          <div className="relative p-6 rounded-full border border-white/10 bg-black">
            <MapPin className="w-8 h-8 text-[#D7FF3C]/40" />
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-bold">No Active Bookings</h4>
          <p className="text-xs text-zinc-600 max-w-[180px] font-light leading-relaxed">
            Identity registry confirmed. Synchronizing with regional gig databases...
          </p>
        </div>
      </div>
    </Card>
  );
}
