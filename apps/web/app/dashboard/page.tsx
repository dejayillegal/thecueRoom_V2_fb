'use client';

import { useState, useCallback, memo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { DashboardContent } from './dashboard-content';

// In production, this would come from session/auth
const mockUser = {
  name: 'Artist',
  email: 'artist@example.com',
  image: null,
};

export default memo(function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Header user={mockUser} onSidebarToggle={handleSidebarToggle} />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <main 
        className={cn(
          'min-h-screen pt-[72px] transition-[margin] duration-200 ease-in-out',
          sidebarOpen ? 'lg:ml-[258px]' : 'lg:ml-0'
        )}
      >
        <DashboardContent user={mockUser} />
      </main>
    </div>
  );
});

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}