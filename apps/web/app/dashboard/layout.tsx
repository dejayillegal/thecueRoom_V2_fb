
'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';

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
  // Start collapsed by default on all devices
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Handle client-side only logic after mount
  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      // On mobile, always close sidebar when resizing
      if (!desktop) {
        setSidebarOpen(false);
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
      {/* Mobile overlay - only show on mobile when sidebar is open */}
      {sidebarOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={handleSidebarToggle}
          aria-hidden="true"
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
        className={cn(
          "min-h-screen pt-[72px] transition-all duration-200 ease-out",
          "ml-0 lg:ml-[60px]",
          sidebarOpen && "lg:ml-[200px]"
        )}
      >
        {children}
      </main>
    </div>
  );
});
