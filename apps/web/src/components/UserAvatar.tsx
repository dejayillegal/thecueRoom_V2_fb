"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  profile: any;
  user?: any;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({ profile, user, className, size = "md" }: UserAvatarProps) {
  const metadata = profile?.socialLinks?.metadata || {};
  const avatarImage = metadata.avatarImage;
  const generatedAvatarSvg = metadata.generatedAvatarSvg;
  
  // Priority: Uploaded > Generated > Fallback
  const renderAvatar = () => {
    if (avatarImage) {
      return <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />;
    }
    if (generatedAvatarSvg) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: generatedAvatarSvg }} 
          className="w-full h-full flex items-center justify-center bg-[#0B0B0B]"
        />
      );
    }
    const initials = (profile?.artistName || user?.username || "?").charAt(0).toUpperCase();
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#9B5CFF] text-white font-bold">
        {initials}
      </div>
    );
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };

  // Trust Ring Logic
  const role = user?.role || "user";
  const isVerified = profile?.verified || false;
  
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
