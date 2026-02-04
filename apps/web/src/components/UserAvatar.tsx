"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getAvatarSrc } from "@/lib/avatar/getAvatarSrc";

interface UserAvatarProps {
  profile: any;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({ profile, className, size = "md" }: UserAvatarProps) {
  const avatarSrc = getAvatarSrc(profile);
  
  const renderAvatar = () => {
    return <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />;
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };

  // Trust Ring Logic
  const role = profile?.role || "user";
  const isVerified = profile?.trustTier === "verified" || false;
  
  let ringClass = "";
  if (role === "admin") ringClass = "animate-trust-admin";
  else if (isVerified) ringClass = "animate-trust-verified";
  else if (profile?.artistName) ringClass = "animate-trust-artist";

  // Presence logic (visual only)
  // Mocking presence based on lastLoginAt if available, or just a pulse
  const lastActive = profile?.updatedAt ? new Date(profile.updatedAt).getTime() : Date.now();
  const diffMinutes = (Date.now() - lastActive) / (1000 * 60);
  
  let presenceClass = "opacity-0";
  if (diffMinutes < 2) presenceClass = "animate-presence-strong";
  else if (diffMinutes < 10) presenceClass = "animate-presence-slow";
  else presenceClass = "border border-gray-600";

  return (
    <div className={cn("relative group cursor-pointer", sizeClasses[size], className)}>
      <div className={cn(
        "absolute -inset-1 rounded-full opacity-50 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md",
        ringClass
      )} />
      <div className={cn(
        "relative w-full h-full rounded-full overflow-hidden border-2 border-[#1a1a1a] transition-transform duration-300 group-hover:scale-[1.03] group-active:scale-[0.98]",
        "animate-breathe"
      )}>
        {renderAvatar()}
      </div>
      <div className={cn(
        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B0B0B]",
        presenceClass
      )} />
    </div>
  );
}
