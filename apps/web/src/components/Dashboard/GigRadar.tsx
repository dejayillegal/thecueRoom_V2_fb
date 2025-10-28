
'use client';

import { VirtualList } from '@/components/VirtualList';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  venue: string;
  date: string;
}

interface GigRadarProps {
  gigs: Gig[];
}

/**
 * Virtualized gig radar for performance with large lists
 */
export function GigRadar({ gigs }: GigRadarProps) {
  if (gigs.length <= 10) {
    return (
      <Card className="bg-[#111111] border-[#1a1a1a] p-4">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Gig Radar
        </h2>
        <div className="space-y-3">
          {gigs.map((gig) => (
            <div key={gig.id} className="p-3 bg-[#0a0a0a] rounded-lg">
              <p className="text-white text-sm font-medium">{gig.title}</p>
              <p className="text-gray-400 text-xs mt-1">{gig.venue}</p>
              <p className="text-[#D1FF3D] text-xs mt-1">{gig.date}</p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#111111] border-[#1a1a1a] p-4">
      <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Gig Radar
      </h2>
      <VirtualList
        items={gigs}
        itemHeight={80}
        containerHeight={400}
        renderItem={(gig) => (
          <div className="p-3 bg-[#0a0a0a] rounded-lg">
            <p className="text-white text-sm font-medium">{gig.title}</p>
            <p className="text-gray-400 text-xs mt-1">{gig.venue}</p>
            <p className="text-[#D1FF3D] text-xs mt-1">{gig.date}</p>
          </div>
        )}
        className="rounded-lg"
      />
    </Card>
  );
}
