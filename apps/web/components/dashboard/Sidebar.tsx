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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/ai/cover-art', label: 'AI Cover Art', icon: Image },
  { href: '/ai/meme-studio', label: 'AI Meme', icon: MessageSquare },
  { href: '/ai/epk-generator', label: 'AI EPK Generator', icon: FileText },
  { href: '/community/forum', label: 'Community Forum', icon: Users },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/gigs/india', label: 'Gig Radar', icon: Radar },
  { href: '/music/weekly', label: 'Weekly Curated Music', icon: Music },
];

export const Sidebar = memo(function Sidebar({ className, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-[258px] bg-[#0b0b0b] border-r border-[#1a1a1a] flex flex-col z-50',
          'transition-transform duration-300 ease-in-out',
          !isOpen && '-translate-x-full',
          className
        )}
      >
        {/* Sidebar Header */}
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--tcr-accent)] flex items-center justify-center">
              <span className="text-black text-sm font-bold">C</span>
            </div>
            <span className="text-white text-[15px] font-semibold">thecueRoom</span>
          </div>
          <button 
            className="lg:hidden p-1.5 rounded-md hover:bg-[#1a1a1a] transition-colors"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto overscroll-contain scrollbar-hide">
          <div className="mb-3 px-2">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Menu</span>
          </div>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200',
                      isActive 
                        ? 'bg-[var(--tcr-accent)] text-black font-semibold shadow-sm' 
                        : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
                    )}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings & Footer */}
        <div className="p-4 border-t border-[#1a1a1a] space-y-3">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200',
              pathname === '/settings'
                ? 'bg-[var(--tcr-accent)] text-black font-semibold'
                : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
            )}
          >
            <Settings size={18} strokeWidth={pathname === '/settings' ? 2.5 : 2} />
            <span>Settings</span>
          </Link>
          <p className="text-[10px] text-gray-600 px-3 leading-relaxed">© thecueRoom Underground Collective</p>
        </div>
      </aside>
    </>
  );
});