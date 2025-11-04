
'use client';

import { useState, useCallback, memo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';

const mockUser = {
  name: 'Artist',
  email: 'artist@example.com',
  image: null,
};

export default memo(function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
