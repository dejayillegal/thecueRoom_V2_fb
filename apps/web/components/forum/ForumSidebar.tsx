'use client';

import { useState, useEffect } from 'react';
import { Award, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopContributor {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  karmaPoints: number;
  badges: string[];
}

export function ForumSidebar() {
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);

  useEffect(() => {
    fetchTopContributors();
  }, []);

  const fetchTopContributors = async () => {
    try {
      const response = await fetch('/api/forum/contributors', { cache: 'no-store' });
      const data = await response.json();
      setTopContributors(data.contributors || []);
    } catch (error) {
      console.error('[Forum] Failed to fetch contributors:', error);
    }
  };

  return (
    <div className="p-8 space-y-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Peak Signalers</h3>
          <Award className="w-3 h-3 text-[#D1FF3D]" />
        </div>
        
        <div className="space-y-4">
          {topContributors.slice(0, 5).map((contributor, i) => (
            <motion.div 
              key={contributor.userId} 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-zinc-500 group-hover:border-[#9B5CFF]/40 transition-colors">
                  {i + 1}
                </div>
                {i === 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#D1FF3D] rounded-full flex items-center justify-center border-2 border-black">
                    <TrendingUp className="w-2 h-2 text-black" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-widest group-hover:text-[#D1FF3D] transition-colors">
                  {contributor.displayName || contributor.username}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-600 font-mono">
                    {contributor.karmaPoints} KHZ
                  </span>
                  {contributor.badges?.[0] && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-white/5 text-zinc-400 rounded-sm border border-white/5">
                      {contributor.badges[0]}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Live Feedback</h3>
          <Users className="w-3 h-3 text-[#9B5CFF]" />
        </div>
        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#D1FF3D] animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Global Mesh Active</span>
           </div>
           <p className="text-[9px] text-zinc-600 font-light leading-relaxed">
             Real-time discussion nodes synchronized across all regional creative hubs.
           </p>
        </div>
      </div>
    </div>
  );
}
