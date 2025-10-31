'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  // Prevent back-button access after logout
  useEffect(() => {
    const handlePopState = () => {
      // Check if session exists
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (!data.user) {
            router.replace('/');
          }
        })
        .catch(() => {
          router.replace('/');
        });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

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

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Clear session data
    sessionStorage.clear();
    localStorage.clear(); // Although not strictly necessary for session, good practice
    // Redirect to landing page
    router.replace('/');
    // Prevent back-button access after logout
    window.history.pushState(null, '', '/'); // Replace current history entry
    window.onbeforeunload = () => { // This might not be reliable across all browsers
      return "Are you sure you want to leave?"; 
    };
  }, [router]);

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
        onLogout={handleLogout} // Pass the logout handler to Header
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