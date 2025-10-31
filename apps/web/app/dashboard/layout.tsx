
'use client';

import { useState, useCallback, memo, useEffect } from 'react';
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
  // Always start collapsed to match server render
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Handle client-side only logic after mount
  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      // Auto-open on desktop on first load
      if (desktop && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile overlay - only show on mobile when open */}
      {sidebarOpen && !isDesktop && (
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
        className="min-h-screen pt-[72px] transition-all duration-200 ease-out"
        style={{ 
          marginLeft: isDesktop 
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
