
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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Default to collapsed on mobile (< 1024px), open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={handleSidebarToggle}
        />
      )}
      
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <Header 
        user={mockUser}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={handleSidebarToggle}
      />
      <main 
        className="min-h-screen pt-[72px] transition-all duration-200 ease-out lg:ml-[200px]"
        style={{ 
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? (sidebarOpen ? '200px' : '60px') 
            : '0px',
          willChange: 'margin-left'
        }}
      >
        {children}
      </main>
    </div>
  );
});
