"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getAvatarSrc } from "@/lib/avatar/getAvatarSrc";

interface UserAvatarProps {
  profile: any;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: (e: React.MouseEvent) => void;
}

export function UserAvatar({ profile, className, size = "md", onClick }: UserAvatarProps) {
  const avatarSrc = getAvatarSrc(profile);
  
  const renderAvatar = () => {
    if (!avatarSrc) return <div className="w-full h-full bg-[#111]" />;
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
  const isVerified = profile?.trustTier === "verified" || profile?.verified || false;
  
  let ringClass = "";
  if (role === "admin") ringClass = "animate-trust-admin bg-[#9B5CFF]";
  else if (isVerified) ringClass = "animate-trust-verified bg-green-500";
  else if (profile?.artistName || role === "artist") ringClass = "animate-trust-artist bg-[#D7FF3C]";

  // Presence logic (visual only)
  const lastActive = profile?.updatedAt ? new Date(profile.updatedAt).getTime() : Date.now();
  const diffMinutes = (Date.now() - lastActive) / (1000 * 60);
  
  let presenceClass = "opacity-0";
  if (diffMinutes < 2) presenceClass = "bg-green-500 animate-pulse";
  else if (diffMinutes < 10) presenceClass = "bg-green-500/50";
  else presenceClass = "bg-zinc-600";

  return (
    <div 
      className={cn("relative group cursor-pointer shrink-0", sizeClasses[size], className)}
      onClick={onClick}
    >
      {ringClass && (
        <div className={cn(
          "absolute -inset-1 rounded-full opacity-50 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md",
          ringClass
        )} />
      )}
      <div className={cn(
        "relative w-full h-full rounded-full overflow-hidden border-2 border-[#1a1a1a] transition-transform duration-300 group-hover:scale-[1.03] group-active:scale-[0.98] bg-[#0B0B0B]",
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
