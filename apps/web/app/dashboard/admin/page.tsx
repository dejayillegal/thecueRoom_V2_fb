
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingSubmissions: 0,
    totalEvents: 0,
    totalArtists: 0,
    recentActivity: [],
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  async function fetchAdminStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm">System overview and moderation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-yellow-400" size={20} />
            <h3 className="text-white font-semibold">Pending Submissions</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pendingSubmissions}</p>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-[var(--tcr-accent)]" size={20} />
            <h3 className="text-white font-semibold">Total Events</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalEvents}</p>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-purple-400" size={20} />
            <h3 className="text-white font-semibold">Total Artists</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalArtists}</p>
        </Card>
      </div>

      <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.href = '/admin/events'}>
            Review Submissions
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/admin/sources'}>
            Manage Sources
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/verification-queue'}>
            Verification Queue
          </Button>
        </div>
      </Card>
    </div>
  );
}
