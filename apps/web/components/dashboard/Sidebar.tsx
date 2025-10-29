'use client';

import { memo } from 'react';
import Link from 'next/link';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/ai/cover-art', label: 'AI Cover Art', icon: Image },
  { href: '/ai/meme-studio', label: 'AI Meme', icon: MessageSquare },
  { href: '/ai/epk-generator', label: 'AI EPK', icon: FileText },
  { href: '/community/forum', label: 'Community Forum', icon: Users },
  { href: '/music/weekly', label: 'Weekly Curated Music', icon: Music },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/gigs/india', label: 'Gigs', icon: Radar },
];

export const Sidebar = memo(function Sidebar({ className, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-black flex flex-col z-40',
        isOpen ? 'w-[200px]' : 'w-[60px]',
        className
      )}
      style={{ transition: 'width 0.2s ease', willChange: 'width' }}
    >
      {/* Sidebar Header */}
      <div className="h-14 flex items-center justify-between px-4">
        {isOpen ? (
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-white text-sm font-semibold">thecueRoom</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center mx-auto">
            <Logo className="h-8 w-8" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto overscroll-contain scrollbar-hide">
        {isOpen && (
          <div className="mb-3 px-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Navigation</span>
          </div>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-2 text-[13px] transition-all duration-200',
                    isActive 
                      ? 'bg-[var(--tcr-accent)] text-black font-medium' 
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white',
                    !isOpen && 'justify-center'
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings & Toggle */}
      <div className="p-2 space-y-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2 px-2.5 py-2 text-[13px] transition-all duration-200',
            pathname === '/settings'
              ? 'bg-[var(--tcr-accent)] text-black font-medium'
              : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white',
            !isOpen && 'justify-center'
          )}
          title={!isOpen ? 'Settings' : undefined}
        >
          <Settings size={18} strokeWidth={pathname === '/settings' ? 2.5 : 2} />
          {isOpen && <span>Settings</span>}
        </Link>
        
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all duration-200"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <>
              <ChevronLeft size={18} />
              <span className="text-xs">Collapse</span>
            </>
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      </div>
    </aside>
  );
});