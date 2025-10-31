'use client';

import { useState, useCallback, memo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

const mockUser = {
  name: 'Artist',
  email: 'artist@example.com',
  image: null,
};

export default memo(function AILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <Header 
        user={mockUser}
        sidebarOpen={sidebarOpen}
      />
      <main 
        className="min-h-screen pt-[72px] ml-0 lg:ml-[60px] transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? '240px' : '64px' }}
      >
        {children}
      </main>
    </div>
  );
});
