'use client';

import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
    <div className="sticky top-6">
      <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#D7FF3C]" />
          Top Contributors
        </h3>
        <div className="space-y-3">
          {topContributors.slice(0, 5).map((contributor, i) => (
            <div key={contributor.userId} className="flex items-center gap-3 p-2 bg-[#111111] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {contributor.displayName || contributor.username}
                </p>
                <p className="text-[10px] text-gray-500">
                  {contributor.karmaPoints} karma
                </p>
              </div>
              {contributor.badges && contributor.badges[0] && (
                <span className="text-sm">{contributor.badges[0]}</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}