
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Ticket, Newspaper } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    pastEvents: 0,
  });

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400 text-sm">Your music hub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-[var(--tcr-accent)]" size={20} />
            <h3 className="text-white font-semibold">Upcoming Events</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.upcomingEvents}</p>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Ticket className="text-purple-400" size={20} />
            <h3 className="text-white font-semibold">Past Events</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pastEvents}</p>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6 hover:border-[var(--tcr-accent)]/30 transition-colors">
          <Link href="/news" className="block">
            <div className="flex items-center gap-3 mb-2">
              <Newspaper className="text-blue-400" size={20} />
              <h3 className="text-white font-semibold">News Feed</h3>
            </div>
            <p className="text-gray-400 text-sm">Stay updated</p>
          </Link>
        </Card>
      </div>

      <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
        <h3 className="text-white font-semibold mb-4">Discover Events</h3>
        <Button onClick={() => window.location.href = '/gigs/india'}>
          Browse Gigs
        </Button>
      </Card>
    </div>
  );
}
