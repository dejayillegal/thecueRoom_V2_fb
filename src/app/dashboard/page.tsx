'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings,
  LayoutGrid,
  Newspaper,
  MicVocal,
  Sparkles,
  MessageSquare,
  Music,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Logo from '@/components/logo';
import { useUser } from '@/firebase/auth/use-user';
import AuthRedirector from '@/components/AuthRedirector';
import Image from 'next/image';
import quickActions from '@/app/lib/placeholder-images.json';
import { dashboardStats, communityUpdates, weeklyCurated } from '@/app/lib/placeholder-data';


// --- Sidebar Component ---
const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/ai/cover-art', label: 'AI Cover Art', icon: MicVocal },
  { href: '/meme-generator', label: 'AI Meme', icon: Sparkles },
  { href: '/ai/epk', label: 'AI EPK Generator', icon: Newspaper },
];
const secondaryNav = [
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/community', label: 'Community Forum', icon: MessageSquare },
  { href: '/music', label: 'Weekly Curated Music', icon: Music },
];
const settingsNav = [{ href: '/settings', label: 'Settings', icon: Settings }];

function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  const renderNav = (items: { href: string; label: string; icon: any }[]) =>
    items.map((item) =>
      isCollapsed ? (
        <TooltipProvider key={item.label} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  pathname === item.href && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            pathname === item.href && 'sidebar-active'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      )
    );

  return (
    <div className={cn("hidden bg-card border-r md:flex flex-col", isCollapsed ? "w-20" : "w-64")}>
        <div className="flex h-16 items-center px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Logo className="h-8 w-8" />
                {!isCollapsed && <span className="">thecueRoom</span>}
            </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <h3 className={cn("px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground/80", isCollapsed && "hidden")}>Navigation</h3>
            <nav className="grid items-start gap-1 text-sm font-medium">
                {renderNav(mainNav)}
            </nav>
            <nav className="grid items-start gap-1 text-sm font-medium pt-4">
                 {renderNav(secondaryNav)}
            </nav>
            <nav className="grid items-start gap-1 text-sm font-medium pt-4">
                 {renderNav(settingsNav)}
            </nav>
        </div>
    </div>
  );
}

// --- Header Component ---
function Header() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-6 sticky top-0 z-40 backdrop-blur-xl">
        <nav className="hidden md:flex items-center gap-1">
            <Button variant={pathname === '/dashboard' ? 'link' : 'ghost'} className={cn(pathname === '/dashboard' && "text-primary font-bold underline")} onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button variant="ghost" disabled>News</Button>
            <Button variant="ghost" disabled>Community</Button>
        </nav>
        
        <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline">Create</Button>
            <Button variant="outline">Upgrade</Button>
            <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">Profile</Button>
        </div>
    </header>
  );
}

function DashboardContent() {
    const { user } = useUser();
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div>
                  <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                  <p className="text-muted-foreground mt-1">Here's a quick overview of your activity</p>
              </div>
              <div className="text-sm text-muted-foreground bg-card px-3 py-1.5 rounded-md border">
                Pro trial: 7 days left
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardStats.map((stat, index) => (
                    <Card key={index} className="bg-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <span className="text-xs text-muted-foreground">Last 7 days</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">Quick actions</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {quickActions.dashboardQuickActions.map((action) => (
                        <Card key={action.title} className="group overflow-hidden bg-card">
                            <Link href={action.href}>
                                <CardHeader className="flex flex-row items-center justify-between text-xs text-muted-foreground p-4">
                                    <span>{action.href === '/community' ? 'Explore' : 'Start'}</span>
                                    <span>{action.title}</span>
                                </CardHeader>
                                <CardContent className="p-0">
                                <div className="relative h-40 w-full">
                                    <Image 
                                        src={action.image}
                                        alt={action.title} 
                                        fill 
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={action.hint}
                                    />
                                </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Latest from the community */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold tracking-tight">Latest from the community</h2>
                        <Button variant="link" size="sm">View all</Button>
                    </div>
                    <Card className="bg-card">
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {communityUpdates.map((update, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4">
                                        <Avatar>
                                            <AvatarImage src={update.avatarUrl} alt={update.name} />
                                            <AvatarFallback>{update.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{update.name}</p>
                                            <p className="text-sm text-muted-foreground">{update.action}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{update.time}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Weekly curated music */}
                <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                         <h2 className="text-xl font-semibold tracking-tight">Weekly curated music</h2>
                         <Button variant="link" size="sm">Open playlist</Button>
                    </div>
                    <Card className="bg-card overflow-hidden">
                        <div className="relative h-48 w-full">
                            <Image src={weeklyCurated.imageUrl} alt="Indie Spotlight" fill className="object-cover" />
                        </div>
                        <div className="p-4">
                             <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">{weeklyCurated.title}</h3>
                                    <p className="text-sm text-muted-foreground">{weeklyCurated.description}</p>
                                </div>
                                <Button>Play</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// --- Main Dashboard Page Component ---
export default function DashboardPage({ children }: { children?: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const isDashboardHome = pathname === '/dashboard';

  return (
      <div className={cn("grid min-h-screen w-full bg-background", isSidebarCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[256px_1fr]")}>
        <AuthRedirector />
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <div className="flex flex-col max-h-screen overflow-y-auto">
          <Header />
          <main className="flex-1 bg-background p-6 md:p-8">
            {isDashboardHome ? <DashboardContent /> : children}
          </main>
        </div>
      </div>
  );
}
