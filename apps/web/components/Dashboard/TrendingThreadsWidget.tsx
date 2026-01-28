"use client";

import { MessageSquare, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export function TrendingThreadsWidget() {
  return (
    <Card className="bg-[#111111]/40 border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md h-full min-h-[400px]">
      <div className="p-8 border-b border-white/5 flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Discussion</h3>
          <p className="text-[10px] text-zinc-500 font-mono">Real-time Pulse</p>
        </div>
        <TrendingUp className="w-4 h-4 text-[#9B5CFF] opacity-50" />
      </div>

      <div className="flex flex-col items-center justify-center p-12 text-center h-[300px] space-y-6">
        <div className="relative p-6 rounded-full border border-white/10 bg-black/40">
           <MessageSquare className="w-8 h-8 text-[#9B5CFF]/20" />
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-bold">Silence in the Hall</h4>
          <p className="text-xs text-zinc-600 max-w-[180px] font-light leading-relaxed">
            Be the first to break the frequency. Starting a new discussion thread.
          </p>
        </div>
      </div>
    </Card>
  );
}
