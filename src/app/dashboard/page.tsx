
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Home,
  Image,
  MessageSquare,
  FileText,
  Users,
  Music,
  Newspaper,
  Calendar,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import AuthRedirector from '@/components/AuthRedirector';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/ai-cover-art', label: 'AI Cover Art', icon: Image },
  { href: '/dashboard/ai-meme', label: 'AI Meme', icon: MessageSquare },
  { href: '/dashboard/ai-epk', label: 'AI EPK Generator', icon: FileText },
  { href: '/dashboard/community', label: 'Community Forum', icon: Users },
  { href: '/dashboard/music', label: 'Weekly Curated Music', icon: Music },
  { href: '/dashboard/news', label: 'News', icon: Newspaper },
  { href: '/dashboard/gigs', label: 'Gigs', icon: Calendar },
];

function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {collapsed && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}
      
      <div 
        className={cn(
          "fixed left-0 top-0 h-screen bg-[rgb(11,11,11)] border-r border-[#1a1a1a] flex flex-col transition-transform z-50",
          "w-[258px]",
          collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}
        data-collapsed={collapsed}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-[72px] items-center px-5 border-b border-[#1a1a1a] justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-[#D1FF3D] flex items-center justify-center">
              <span className="text-black text-sm font-bold">C</span>
            </div>
            <span className="text-white text-[15px] font-semibold">thecueRoom</span>
          </Link>
          <button 
            className="lg:hidden text-white"
            onClick={() => setCollapsed(true)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 pt-6">
          <div className="mb-3 px-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#666666]">
              Navigation
            </h3>
          </div>
          <nav className="space-y-1 mt-3">
            {mainNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all relative',
                    isActive 
                      ? 'bg-[#D1FF3D] text-black font-semibold' 
                      : 'text-white hover:bg-[#1a1a1a] font-normal'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-4">
          <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all',
              pathname === '/dashboard/settings' 
                ? 'bg-[#D1FF3D] text-black font-semibold' 
                : 'text-white hover:bg-[#1a1a1a] font-normal'
            )}
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={pathname === '/dashboard/settings' ? 2.5 : 2} />
            Settings
          </Link>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-[#666666]">© thecueRoom Underground Collective</p>
        </div>
      </div>

      {/* Mobile hamburger */}
      <button
        className={cn(
          "fixed top-5 left-5 z-30 lg:hidden bg-[rgb(11,11,11)] border border-[#1a1a1a] rounded-md p-2",
          !collapsed && "hidden"
        )}
        onClick={() => setCollapsed(false)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>
    </>
  );
}

function Header() {
  const { user } = useUser();

  return (
    <header className="h-[72px] px-6 flex items-center justify-between bg-[rgb(17,17,17)] border-b border-[#1a1a1a]">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="Search artists, gigs, news..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-[13px] text-white placeholder:text-[#666666] focus:outline-none focus:border-[#333333] transition-colors"
            aria-label="Search"
          />
        </div>
      </div>
      
      {/* User Avatar */}
      <div className="flex items-center gap-3 ml-6">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.photoURL || undefined} alt="User avatar" />
          <AvatarFallback className="text-xs font-bold bg-[#D1FF3D] text-black">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function DashboardContent() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Top Section - Verification Pending (2 cols) + Gig Radar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Verification Pending - spans 2 columns */}
        <div className="lg:col-span-2 verification-banner rounded-lg p-6 border border-[#1a1a1a] relative overflow-hidden">
          <div className="hero-glow"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-semibold text-white mb-1.5">Verification Pending</h2>
              <p className="text-[13px] text-[#999999]">Your account is under review. You'll be notified once approved.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="h-9 px-5 text-[13px] font-medium border-[#333333] text-white bg-transparent hover:bg-[#1a1a1a] hover:text-white hover:border-[#444444]"
              >
                Sign Out
              </Button>
              <Button 
                className="h-9 px-5 text-[13px] font-semibold bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        {/* Gig Radar - Right Column */}
        <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <h2 className="text-[16px] font-semibold text-white mb-4">Gig Radar</h2>
          <div className="space-y-3">
            <div>
              <div className="text-[14px] font-medium text-white">Industrial Night</div>
              <div className="text-[12px] mt-1 text-[#666666]">Today</div>
            </div>
            <div>
              <div className="text-[14px] font-medium text-white">Deep House Pop-up</div>
              <div className="text-[12px] mt-1 text-[#666666]">Tomorrow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Three Column Grid - Spotlight, Gig Radar Details, Verification Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Spotlight */}
        <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <h2 className="text-[16px] font-semibold text-white mb-4">Spotlight</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Music className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D1FF3D]" />
              <div>
                <div className="text-[13px] font-semibold text-white">🎵 Trending Artist</div>
                <div className="text-[11px] mt-1 text-[#666666] leading-relaxed">Fresh new spotlight from the underground.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gig Radar Details (Center) */}
        <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <h2 className="text-[16px] font-semibold text-white mb-4">Gig Radar</h2>
          <div className="space-y-2.5">
            <div className="p-3 rounded-md bg-black/60 border border-[#1a1a1a]">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13px] font-medium text-white">Bangalore Warehouse 03</div>
                <div className="text-[11px] text-[#999999] whitespace-nowrap">Fri • 11:30 PM</div>
              </div>
            </div>
            <div className="p-3 rounded-md bg-black/60 border border-[#1a1a1a]">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13px] font-medium text-white">Basement House 12</div>
                <div className="text-[11px] text-[#999999] whitespace-nowrap">Sat • 10:00 PM</div>
              </div>
            </div>
            <div className="p-3 rounded-md bg-black/60 border border-[#1a1a1a]">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13px] font-medium text-white">Secret Rooftop</div>
                <div className="text-[11px] text-[#999999] whitespace-nowrap">Sun • 7:00 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <h2 className="text-[16px] font-semibold text-white mb-4">Verification Status</h2>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#D1FF3D] animate-pulse"></div>
            <span className="text-[13px] text-[#999999]">Pending review</span>
          </div>
        </div>
      </div>

      {/* Bottom Section - Empty left, Verification Status center, Curators right */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="hidden lg:block"></div>
        <div className="hidden lg:block"></div>
        {/* Curators */}
        <div className="bg-[#0f0f0f] rounded-lg p-5 border border-[#1a1a1a]">
          <h2 className="text-[16px] font-semibold text-white mb-4">Curators</h2>
          <div className="flex gap-2.5">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#D1FF3D]">C1</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#D1FF3D]">C2</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#D1FF3D]">C3</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Private Beta Footer */}
      <div className="flex justify-end pb-4">
        <span className="text-[11px] text-[#666666]">Private beta</span>
      </div>
    </div>
  );
}

export default function DashboardPage({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';

  return (
    <div className="bg-black min-h-screen grain-overlay">
      <AuthRedirector />
      <Sidebar />
      <div className="lg:ml-[258px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {isDashboardHome ? <DashboardContent /> : children}
        </main>
      </div>
    </div>
  );
}
