'use client';

import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { memo, useCallback } from 'react';
import { Bell, Settings, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header = memo(function Header({ user, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const handleLogout = useCallback(async () => {
    try {
      // Clear session cookie
      await fetch('/api/auth/signout', { method: 'POST' });
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Redirect to landing page and replace history to prevent back button
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.replace('/');
    }
  }, [router]);

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 h-[72px] bg-black border-b border-[#1a1a1a] flex items-center justify-between px-6 z-30 transition-all duration-200 ease-out",
        "left-0 lg:left-[60px]",
        sidebarOpen && "lg:left-[200px]"
      )}
    >
      {/* Mobile menu button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSidebar?.();
        }}
        className="lg:hidden p-2 text-white hover:bg-[#1a1a1a] rounded-md transition-colors"
        aria-label="Toggle menu"
        type="button"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="search"
            placeholder="Search artists, gigs, news..."
            className="w-full h-9 pl-10 pr-4 bg-transparent border border-[#1a1a1a] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#2a2a2a] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-white hover:bg-[#1a1a1a] rounded-md" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button className="p-2 text-white hover:bg-[#1a1a1a] rounded-md" aria-label="Settings">
          <Settings size={20} />
        </button>
        <button 
          onClick={handleLogout}
          className="p-2 text-white hover:bg-[#1a1a1a] rounded-md" 
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>

        <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-transparent hover:ring-[#1a1a1a] transition-all">
          <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-[var(--tcr-accent)] text-black text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
});

Header.displayName = 'Header';