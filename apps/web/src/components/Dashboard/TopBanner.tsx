
'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

/**
 * Top banner component (lazy-loaded)
 */
export function TopBanner() {
  return (
    <Card className="bg-gradient-to-r from-[#D1FF3D]/10 to-[#9B5CFF]/10 border-[#1a1a1a] p-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-[#D1FF3D]" />
        <div>
          <h2 className="text-white font-semibold text-lg">Welcome to thecueRoom</h2>
          <p className="text-gray-400 text-sm">Your underground music hub</p>
        </div>
      </div>
    </Card>
  );
}
