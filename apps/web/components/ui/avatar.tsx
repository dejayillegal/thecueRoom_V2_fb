
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { resolveAvatar } from "@/lib/avatar/avatarResolver"

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  username?: string;
  avatarImage?: string;
  generatedAvatarSvg?: string;
  lastActivity?: number;
  role?: 'admin' | 'verified' | 'artist' | 'user';
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, username, avatarImage, generatedAvatarSvg, lastActivity, role = 'user', ...props }, ref) => {
  const resolvedSrc = React.useMemo(() => 
    resolveAvatar({ username: username || 'anonymous', avatarImage, generatedAvatarSvg }),
    [username, avatarImage, generatedAvatarSvg]
  );

  const presenceState = React.useMemo(() => {
    if (!lastActivity) return 'idle';
    const diff = (Date.now() - lastActivity) / 1000 / 60;
    if (diff < 2) return 'active';
    if (diff < 10) return 'fading';
    return 'idle';
  }, [lastActivity]);

  const ringClass = React.useMemo(() => {
    switch (role) {
      case 'admin': return 'ring-2 ring-[#D7FF3C] ring-admin';
      case 'verified': return 'ring-2 ring-[#9B5CFF] ring-verified';
      case 'artist': return 'ring-1 ring-white/40 ring-artist';
      default: return '';
    }
  }, [role]);

  return (
    <div className={cn("avatar-container relative inline-block rounded-full p-0.5", ringClass)}>
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        <AvatarPrimitive.Image
          src={resolvedSrc}
          className="aspect-square h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted">
          {(username || 'A')[0].toUpperCase()}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      <div className={cn(
        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
        presenceState === 'active' && "bg-[#D7FF3C] presence-active",
        presenceState === 'fading' && "bg-[#D7FF3C]/50 presence-fading",
        presenceState === 'idle' && "bg-zinc-600 presence-idle"
      )} />
    </div>
  )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = AvatarPrimitive.Image
const AvatarFallback = AvatarPrimitive.Fallback

export { Avatar, AvatarImage, AvatarFallback }
