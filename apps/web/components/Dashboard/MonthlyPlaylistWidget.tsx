"use client";

import { Music, PlayCircle, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MonthlyPlaylistWidget() {
  return (
    <Card className="bg-[#111111]/40 border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md h-full min-h-[400px] group transition-all duration-500 hover:border-[#D7FF3C]/20">
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-transparent to-white/[0.02]">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Sonic Selection</h3>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Curated Frequency</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-[#D7FF3C]/30 transition-all">
          <Radio className="w-4 h-4 text-[#D7FF3C] animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-12 text-center h-[300px] space-y-8">
        <div className="relative p-10 rounded-[48px] bg-gradient-to-br from-[#9B5CFF]/10 via-[#9B5CFF]/5 to-transparent border border-white/5 overflow-hidden group/icon">
           <div className="absolute inset-0 bg-[#9B5CFF]/20 opacity-0 group-hover/icon:opacity-100 transition-opacity blur-3xl" />
           <div className="absolute -inset-1 bg-gradient-to-tr from-[#9B5CFF]/20 to-transparent opacity-50 blur-xl" />
           <PlayCircle className="w-16 h-16 text-[#9B5CFF] relative z-10 transition-transform duration-700 group-hover/icon:scale-110" />
        </div>
        <div className="space-y-3">
          <h4 className="text-white font-bold tracking-tight text-lg italic">Upcoming Selection</h4>
          <p className="text-xs text-zinc-500 max-w-[220px] font-light leading-relaxed">
            Identity registry confirmed. Curators are currently selecting high-fidelity signals for this cycle.
          </p>
        </div>
      </div>
      
      <div className="px-8 pb-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
    </Card>
  );
}
