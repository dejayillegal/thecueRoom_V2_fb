
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  LayoutGrid,
  Newspaper,
  MicVocal,
  Sparkles,
  MessageSquare,
  Music,
  Calendar,
  Search,
  Clock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Logo from '@/components/logo';
import { useUser } from '@/firebase/auth/use-user';
import AuthRedirector from '@/components/AuthRedirector';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/ai/cover-art', label: 'AI Cover Art', icon: MicVocal },
  { href: '/meme-generator', label: 'AI Meme', icon: Sparkles },
  { href: '/ai/epk', label: 'AI EPK Generator', icon: Newspaper },
  { href: '/community', label: 'Community Forum', icon: MessageSquare },
  { href: '/music', label: 'Weekly Curated Music', icon: Music },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/gigs', label: 'Gigs', icon: Calendar },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen fixed left-0 top-0 flex flex-col" style={{ backgroundColor: 'rgb(0, 0, 0)', borderRight: '1px solid rgb(38, 38, 38)' }}>
      <div className="flex h-16 items-center px-4" style={{ borderBottom: '1px solid rgb(38, 38, 38)' }}>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-8 w-8" />
          <span style={{ color: 'rgb(200, 255, 0)' }}>thecueRoom</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="px-3 pb-2 text-xs font-semibold uppercase" style={{ color: 'rgb(115, 115, 115)' }}>Navigation</h3>
        <nav className="space-y-1">
          {mainNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                pathname === item.href 
                  ? 'font-semibold' 
                  : 'hover:bg-[rgb(26,26,26)]'
              )}
              style={pathname === item.href 
                ? { backgroundColor: 'rgb(200, 255, 0)', color: 'rgb(0, 0, 0)' } 
                : { color: 'rgb(156, 163, 175)' }
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-3" style={{ borderTop: '1px solid rgb(38, 38, 38)' }}>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
            pathname === '/settings' 
              ? 'font-semibold' 
              : 'hover:bg-[rgb(26,26,26)]'
          )}
          style={pathname === '/settings' 
            ? { backgroundColor: 'rgb(200, 255, 0)', color: 'rgb(0, 0, 0)' } 
            : { color: 'rgb(156, 163, 175)' }
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div className="p-4 text-xs" style={{ borderTop: '1px solid rgb(38, 38, 38)', color: 'rgb(115, 115, 115)' }}>
        © thecueRoom Underground Collective
      </div>
    </div>
  );
}

function Header() {
  const { user } = useUser();

  return (
    <header className="h-16 px-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(38, 38, 38)', backgroundColor: 'rgb(0, 0, 0)' }}>
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'rgb(115, 115, 115)' }} />
          <input
            type="text"
            placeholder="Search artists, gigs, news..."
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none"
            style={{ 
              backgroundColor: 'rgb(15, 15, 15)', 
              border: '1px solid rgb(42, 42, 42)',
              color: 'rgb(209, 213, 219)',
              caretColor: 'rgb(250, 250, 250)'
            }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'rgb(200, 255, 0)', color: 'rgb(0, 0, 0)' }}>
            {user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function DashboardContent() {
  return (
    <div className="space-y-4">
      {/* Verification Banner */}
      <Card style={{ backgroundColor: 'rgb(15, 15, 15)', border: '1px solid rgb(38, 38, 38)' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'rgb(250, 250, 250)' }}>Verification Pending</h2>
              <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>Your account is under review. You'll be notified once approved.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="font-medium" style={{ borderColor: 'rgb(115, 115, 115)', color: 'rgb(209, 213, 219)', backgroundColor: 'transparent' }}>
                Sign Out
              </Button>
              <Button className="font-semibold" style={{ backgroundColor: 'rgb(200, 255, 0)', color: 'rgb(0, 0, 0)' }}>
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Spotlight */}
        <div className="lg:col-span-4">
          <Card style={{ backgroundColor: 'rgb(15, 15, 15)', border: '1px solid rgb(38, 38, 38)' }}>
            <CardContent className="p-5">
              <h2 className="text-base font-bold mb-4" style={{ color: 'rgb(250, 250, 250)' }}>Spotlight</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Music className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(200, 255, 0)' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>🎵 Trending Artist</div>
                    <div className="text-xs mt-1" style={{ color: 'rgb(115, 115, 115)' }}>Fresh new spotlight from the underground.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gig Radar */}
        <div className="lg:col-span-4">
          <Card style={{ backgroundColor: 'rgb(15, 15, 15)', border: '1px solid rgb(38, 38, 38)' }}>
            <CardContent className="p-5">
              <h2 className="text-base font-bold mb-4" style={{ color: 'rgb(250, 250, 250)' }}>Gig Radar</h2>
              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>Bangalore Warehouse 03</div>
                  <div className="text-xs mt-1" style={{ color: 'rgb(115, 115, 115)' }}>Fri • 11:30 PM</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>Basement House 12</div>
                  <div className="text-xs mt-1" style={{ color: 'rgb(115, 115, 115)' }}>Sat • 10:00 PM</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>Secret Rooftop</div>
                  <div className="text-xs mt-1" style={{ color: 'rgb(115, 115, 115)' }}>Sun • 7:00 PM</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-4">
          <Card style={{ backgroundColor: 'rgb(15, 15, 15)', border: '1px solid rgb(38, 38, 38)' }}>
            <CardContent className="p-5">
              <h2 className="text-base font-bold mb-4" style={{ color: 'rgb(250, 250, 250)' }}>Gig Radar</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>Industrial Night</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgb(115, 115, 115)' }}>Today</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>Deep House Pop-up</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgb(115, 115, 115)' }}>Tomorrow</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'rgb(15, 15, 15)', border: '1px solid rgb(38, 38, 38)' }}>
            <CardContent className="p-5">
              <h2 className="text-base font-bold mb-4" style={{ color: 'rgb(250, 250, 250)' }}>Verification Status</h2>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: 'rgb(156, 163, 175)' }} />
                <span className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>Pending review</span>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'rgb(15, 15, 15)', border: '1px solid rgb(38, 38, 38)' }}>
            <CardContent className="p-5">
              <h2 className="text-base font-bold mb-4" style={{ color: 'rgb(250, 250, 250)' }}>Curators</h2>
              <div className="flex gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'rgb(42, 42, 42)', color: 'rgb(200, 255, 0)' }}>C1</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'rgb(42, 42, 42)', color: 'rgb(200, 255, 0)' }}>C2</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'rgb(42, 42, 42)', color: 'rgb(200, 255, 0)' }}>C3</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card style={{ backgroundColor: 'rgb(15, 15, 15)', border: '1px solid rgb(38, 38, 38)' }}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'rgb(250, 250, 250)' }}>Recent Activity</h2>
            <div className="text-xs flex items-center gap-1" style={{ color: 'rgb(115, 115, 115)' }}>
              <div className="animate-spin w-3 h-3 border-2 rounded-full" style={{ borderColor: 'rgb(115, 115, 115)', borderTopColor: 'transparent' }}></div>
              Loading
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'rgb(42, 42, 42)', color: 'rgb(200, 255, 0)' }}>AM</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>Ava Martinez</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgb(115, 115, 115)' }}>Queued update while verification completes</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'rgb(42, 42, 42)', color: 'rgb(200, 255, 0)' }}>SY</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'rgb(250, 250, 250)' }}>System</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgb(115, 115, 115)' }}>Invite-only access enforced</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <span className="text-xs" style={{ color: 'rgb(115, 115, 115)' }}>Private beta</span>
      </div>
    </div>
  );
}

export default function DashboardPage({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';

  return (
    <div style={{ backgroundColor: 'rgb(0, 0, 0)', minHeight: '100vh' }}>
      <AuthRedirector />
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {isDashboardHome ? <DashboardContent /> : children}
        </main>
      </div>
    </div>
  );
}
