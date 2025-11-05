'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  Image,
  MessageSquare,
  FileText,
  Users,
  Music,
  Newspaper,
  Radar,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { SidebarItem } from './SidebarItem';
import { usePersistentToggle } from '@/hooks/usePersistentToggle';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const getNavItemsForRole = (role: string) => {
  const commonItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/gigs/india', label: 'Gigs', icon: Radar },
  ];

  const artistItems = [
    { href: '/ai/cover-art', label: 'AI Cover Art', icon: Image },
    { href: '/ai/meme-studio', label: 'AI Meme', icon: MessageSquare },
    { href: '/ai/epk-generator', label: 'AI EPK', icon: FileText },
    { href: '/community/forum', label: 'Community Forum', icon: Users },
    { href: '/music/weekly', label: 'Curated Music', icon: Music },
  ];

  if (role === 'admin') {
    return [...commonItems, ...artistItems,
      { href: '/admin/events', label: 'Review Events', icon: CheckCircle2 },
      { href: '/admin/sources', label: 'Manage Sources', icon: Settings },
      { href: '/admin/monthly-playlists', label: 'Playlist Config', icon: Music }
    ];
  }

  if (role === 'artist') {
    return [...commonItems, ...artistItems];
  }

  return commonItems;
};

export const Sidebar = memo(function Sidebar({ className, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, toggleExpanded] = usePersistentToggle('sidebar-expanded', false);
  const [userRole, setUserRole] = useState<string>('user');
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const session = await res.json();
          const role = session.user?.role || 'user';
          setUserRole(role);
          setCanSubmit(role === 'admin' || role === 'artist');
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    }
    fetchUserRole();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavClick = useCallback(() => {
    if (isMobile && isOpen) {
      onToggle();
    }
  }, [isMobile, isOpen, onToggle]);

  const handleExpandToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded();
  }, [toggleExpanded]);

  const handleBackdropClick = useCallback(() => {
    if (isMobile && isOpen) {
      onToggle();
    }
  }, [isMobile, isOpen, onToggle]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMobile && isOpen) {
      onToggle();
    }
  }, [isMobile, isOpen, onToggle]);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobile, isOpen, handleEscape]);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  const sidebarWidth = expanded ? 'w-[240px]' : 'w-[64px]';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-black flex flex-col z-40 border-r border-[#1a1a1a]',
          'transition-transform duration-200 ease-out',
          isMobile ? (
            isOpen ? 'translate-x-0' : '-translate-x-full'
          ) : 'translate-x-0',
          isMobile ? 'w-[64px]' : sidebarWidth,
          '@media (prefers-reduced-motion: reduce) { transition-duration: 0ms; }',
          className
        )}
        aria-label="Main navigation"
        role="navigation"
        aria-hidden={isMobile && !isOpen}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
          {expanded && !isMobile ? (
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-white text-sm font-semibold whitespace-nowrap">thecueRoom</span>
            </div>
          ) : (
            <div className="flex items-center justify-center mx-auto">
              <Logo className="h-8 w-8" />
            </div>
          )}

          {isMobile && isOpen && (
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto overscroll-contain scrollbar-hide">
          {expanded && !isMobile && (
            <div className="mb-3 px-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </span>
            </div>
          )}
          <ul className="space-y-1">
            {getNavItemsForRole(userRole).map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    active={isActive}
                    expanded={expanded && !isMobile}
                    onClick={handleNavClick}
                  />
                </li>
              );
            })}

            {canSubmit && (
              <li className="pt-2 border-t border-[#1a1a1a]">
                <button
                  onClick={() => window.location.href = '/events/submit'}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 text-[var(--tcr-accent)]',
                    'hover:bg-[#1a1a1a]',
                    'transition-all duration-200 rounded-md',
                    'min-h-[44px] touch-manipulation',
                    !expanded && !isMobile && 'justify-center'
                  )}
                >
                  <Plus size={18} />
                  {(expanded && !isMobile) && <span className="text-xs font-medium">Submit Event</span>}
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Settings & Expand Toggle */}
        <div className="p-2 space-y-2 flex-shrink-0">
          <SidebarItem
            icon={Settings}
            label="Settings"
            href="/settings"
            active={pathname === '/settings'}
            expanded={expanded && !isMobile}
            onClick={handleNavClick}
          />

          {/* Expand/Collapse Toggle */}
          <button
            onClick={handleExpandToggle}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-2 text-gray-400',
              'hover:bg-[#1a1a1a] hover:text-white',
              'transition-all duration-200 rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-[var(--tcr-accent)] focus:ring-offset-2 focus:ring-offset-black',
              'min-h-[44px] touch-manipulation',
              !expanded && !isMobile && 'justify-center'
            )}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={expanded}
          >
            {expanded && !isMobile ? (
              <>
                <ChevronLeft size={18} aria-hidden="true" />
                <span className="text-xs">Collapse</span>
              </>
            ) : (
              <ChevronRight size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
});