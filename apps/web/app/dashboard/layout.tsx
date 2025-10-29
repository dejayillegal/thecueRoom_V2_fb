
'use client';

import { useState, useCallback, memo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

const mockUser = {
  name: 'Artist',
  email: 'artist@example.com',
  image: null,
};

export default memo(function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <Header 
        user={mockUser}
        sidebarOpen={sidebarOpen}
      />
      <main 
        className="min-h-screen pt-[72px] transition-all duration-200 ease-out"
        style={{ 
          marginLeft: sidebarOpen ? '200px' : '60px',
          willChange: 'margin-left'
        }}
      >
        {children}
      </main>
    </div>
  );
});
