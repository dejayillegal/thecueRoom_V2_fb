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
  Settings
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
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-[72px] h-[calc(100vh-72px)] w-[258px] bg-[#0b0b0b] border-r border-[#1a1a1a] flex flex-col z-50',
          'transition-transform duration-200 ease-in-out',
          !isOpen && '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <nav className="flex-1 p-4 overflow-y-auto overscroll-contain">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors',
                      isActive 
                        ? 'bg-[var(--tcr-accent)] text-black font-semibold' 
                        : 'text-white hover:bg-[#1a1a1a]'
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

        <div className="p-4 border-t border-[#1a1a1a]">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white hover:bg-[#1a1a1a] transition-colors mb-3"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <p className="text-[10px] text-gray-600 px-3">© thecueRoom Underground Collective</p>
        </div>
      </aside>
    </>
  );
});