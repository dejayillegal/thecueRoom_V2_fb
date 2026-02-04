"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { resolveAvatar } from "@/lib/avatar/avatarResolver";

interface UserAvatarProps {
  profile: any;
  user?: any;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({ profile, user, className, size = "md" }: UserAvatarProps) {
  const avatarSvg = resolveAvatar(profile);
  
  const isBase64 = avatarSvg.startsWith("data:image/");

  const renderAvatar = () => {
    if (isBase64) {
      return <img src={avatarSvg} alt="Avatar" className="w-full h-full object-cover" />;
    }
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: avatarSvg }} 
        className="w-full h-full flex items-center justify-center bg-[#0B0B0B]"
      />
    );
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };

  // Trust Ring Logic
  const role = user?.role || profile?.role || "user";
  const isVerified = profile?.verified || false;
  
  let ringClass = "";
  if (role === "admin") ringClass = "animate-trust-admin";
  else if (isVerified) ringClass = "animate-trust-verified";
  else if (profile?.artistName) ringClass = "animate-trust-artist";

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
    </div>
  );
}
