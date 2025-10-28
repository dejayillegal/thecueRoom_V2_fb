'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Image, 
  MessageSquare, 
  Newspaper, 
  Calendar,
  CheckCircle,
  Settings,
  Sparkles
} from 'lucide-react';

const navigationItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Cover Art', href: '/dashboard/cover-art', icon: Image },
  { name: 'Memes', href: '/dashboard/memes', icon: MessageSquare },
  { name: 'News', href: '/dashboard/news', icon: Newspaper },
  { name: 'Gigs', href: '/dashboard/gigs', icon: Calendar },
];

const adminItems = [
  { name: 'Verification', href: '/dashboard/verification', icon: CheckCircle },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#0a1a0a] border-r border-[#1a2a1a] flex flex-col">
      <div className="p-4 border-b border-[#1a2a1a]">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo className="w-6 h-6" />
          <span className="text-base font-bold text-[#c8ff00]">thecueRoom</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </h3>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive 
                      ? "bg-[#1a2a1a] text-[#c8ff00]" 
                      : "text-gray-400 hover:bg-[#1a2a1a] hover:text-gray-200"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Admin
          </h3>
          <div className="space-y-1">
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive 
                      ? "bg-[#1a2a1a] text-[#c8ff00]" 
                      : "text-gray-400 hover:bg-[#1a2a1a] hover:text-gray-200"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 space-y-2 border-t border-[#1a2a1a]">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1a2a1a] rounded text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          Invite-only
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1a2a1a] rounded text-xs text-gray-400">
          <Sparkles className="w-3 h-3" />
          AI Tools Enabled
        </div>
      </div>
    </aside>
  );
}
