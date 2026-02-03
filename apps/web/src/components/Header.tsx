"use client";

import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";

/**
 * Dashboard header with debounced search and identity
 */
export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/profile/me")
      .then(res => res.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
        if (data.user) setUser(data.user);
      })
      .catch(err => console.error("Header identity fetch error:", err));
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-[#0B0B0B] border-b border-[#1a1a1a] px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="pl-10 bg-[#111111] border-[#1a1a1a] text-white"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">
              {profile?.artistName || user?.username || "Guest"}
            </p>
            {profile?.artistName && user?.username && (
              <p className="text-xs text-gray-500">@{user.username}</p>
            )}
          </div>
          <Link href="/settings">
            <UserAvatar profile={profile} user={user} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}
