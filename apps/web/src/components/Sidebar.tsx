// This file is deprecated. Use @/components/dashboard/Sidebar instead.
// Keeping for backwards compatibility but should be removed.

"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Music, Newspaper, Calendar, Settings } from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/music/weekly", icon: Music, label: "Music" },
  { href: "/news", icon: Newspaper, label: "News" },
  { href: "/gigs/india", icon: Calendar, label: "Gigs" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

/**
 * Memoized sidebar component with clean navigation
 * Uses Next.js Link for client-side routing
 */
export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0B0B0B] border-r border-[#1a1a1a] flex flex-col">
      <div className="p-6 border-b border-[#1a1a1a]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="thecueRoom"
            width={32}
            height={32}
            priority
          />
          <span className="text-xl font-bold text-white">thecueRoom</span>
        </Link>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#D1FF3D] text-black"
                      : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
});
