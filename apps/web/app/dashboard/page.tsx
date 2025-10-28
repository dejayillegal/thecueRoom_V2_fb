'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { DashboardContent } from './dashboard-content';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Memoize toggle function to prevent unnecessary re-renders
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // In production, this would come from session/auth
  const user = {
    name: 'Artist',
    email: 'artist@example.com',
    image: null,
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Header user={user} onSidebarToggle={handleSidebarToggle} />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <main className={`pt-[72px] min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-[258px]' : 'ml-0'}`}>
        <DashboardContent user={user} />
      </main>
    </div>
  );
}