'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

export default memo(function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Redirect logic for protected routes could go here if needed
  
  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) setSidebarOpen(false);
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
    sessionStorage.clear();
    localStorage.clear();
    router.replace('/');
  }, [router]);

  // Define routes that should NOT show the sidebar (e.g. landing page, login)
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname === '/signup';
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  const mockUser = {
    name: 'User',
    email: 'user@example.com',
    image: null,
  };

  return (
    <div className="min-h-screen bg-black">
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
