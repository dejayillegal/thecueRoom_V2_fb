
'use client';

import { VirtualList } from '@/components/VirtualList';
import { Card } from '@/components/ui/card';

interface Activity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

/**
 * Virtualized recent activity list for performance
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="bg-[#111111] border-[#1a1a1a] p-4">
      <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
      <VirtualList
        items={activities}
        itemHeight={60}
        containerHeight={400}
        renderItem={(activity) => (
          <div className="p-3 border-b border-[#1a1a1a] last:border-0">
            <p className="text-white text-sm">{activity.title}</p>
            <p className="text-gray-500 text-xs mt-1">{activity.timestamp}</p>
          </div>
        )}
        className="rounded-lg bg-[#0a0a0a]"
      />
    </Card>
  );
}
