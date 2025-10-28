
'use client';

import { Clock, AlertCircle, Sparkles, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardContentProps {
  user?: {
    email?: string | null;
  } | null;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const gigRadarItems = [
    { title: 'Fabric London - Techno Night', date: 'Dec 28' },
    { title: 'Printworks Finale', date: 'Jan 5' },
    { title: 'Berghain Showcase', date: 'Jan 12' },
  ];

  const recentActivity = [
    {
      user: 'Alex Chen',
      action: 'submitted new track',
      time: '2 hours ago',
      avatar: null,
    },
    {
      user: 'DJ Shadow',
      action: 'updated gig listing',
      time: '5 hours ago',
      avatar: null,
    },
  ];

  const curators = [
    { name: 'Maya', avatar: null },
    { name: 'Jordan', avatar: null },
    { name: 'Sam', avatar: null },
  ];

  return (
    <main className="ml-0 lg:ml-[258px] mt-[72px] min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Verification Pending Banner */}
          <div className="lg:col-span-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-6 relative overflow-hidden hero-glow">
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-[var(--tcr-accent)] mt-1" size={20} />
                <div>
                  <h2 className="text-[18px] font-semibold text-white mb-2">Verification Pending</h2>
                  <p className="text-[13px] text-[#999999] leading-relaxed max-w-xl">
                    Your artist profile is currently under review. We typically verify accounts within 24-48 hours. 
                    You'll receive an email at <span className="text-white">{user?.email || 'your email'}</span> once approved.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="sm" className="border-[#1a1a1a] hover:bg-[#1a1a1a]">
                  Sign Out
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[var(--tcr-accent)] text-black hover:bg-[var(--tcr-accent)]/90 font-semibold"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>

          {/* Gig Radar Card */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-[var(--tcr-accent)]" size={18} />
              <h3 className="text-[15px] font-semibold">Gig Radar</h3>
            </div>
            <ul className="space-y-3">
              {gigRadarItems.map((item, i) => (
                <li key={i} className="flex justify-between items-start">
                  <span className="text-[13px] text-gray-300">{item.title}</span>
                  <span className="text-[11px] text-gray-500">{item.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Spotlight Card */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-[var(--tcr-accent)]" size={18} />
              <h3 className="text-[15px] font-semibold">Spotlight</h3>
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed">
              Featured artists and trending tracks will appear here once your profile is verified.
            </p>
          </div>

          {/* Gig Radar Compact */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-purple-400" size={18} />
              <h3 className="text-[15px] font-semibold">Upcoming Events</h3>
            </div>
            <p className="text-[13px] text-gray-400">3 events in your area</p>
          </div>

          {/* Verification Status */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-orange-400" size={18} />
              <h3 className="text-[15px] font-semibold">Verification Status</h3>
            </div>
            <p className="text-[13px] text-gray-400">Under review</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Recent Activity</h3>
              <div className="animate-spin">
                <div className="w-4 h-4 border-2 border-[var(--tcr-accent)] border-t-transparent rounded-full" />
              </div>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.avatar || undefined} />
                    <AvatarFallback className="bg-[var(--tcr-accent)] text-black text-xs">
                      {activity.user[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] text-white">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-[11px] text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Curators */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
            <h3 className="text-[15px] font-semibold mb-4">Curators</h3>
            <div className="flex -space-x-2">
              {curators.map((curator, i) => (
                <Avatar key={i} className="w-10 h-10 border-2 border-[#0f0f0f]">
                  <AvatarImage src={curator.avatar || undefined} />
                  <AvatarFallback className="bg-[var(--tcr-accent)] text-black text-sm">
                    {curator.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <p className="text-[11px] text-gray-600">Private beta</p>
        </div>
      </div>
    </main>
  );
}
