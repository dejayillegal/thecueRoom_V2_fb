'use client';
import { User } from 'lucide-react';
import { resolveAvatar } from '@/lib/identity/avatarResolver';

interface UserAvatarProps {
  user: {
    id: string;
    avatarUrl?: string | null;
    generatedAvatarUrl?: string | null;
    displayName?: string | null;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const avatarUrl = resolveAvatar(user.avatarUrl, user.generatedAvatarUrl);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-white/10 shadow-inner flex items-center justify-center">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={user.displayName || 'User avatar'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-1/2 h-1/2 text-zinc-600" />
        )}
      </div>
      
      {/* Presence Indicator Placeholder */}
      <div className="absolute bottom-0 right-0 w-[25%] h-[25%] rounded-full bg-lime-500 border-2 border-black" />
    </div>
  );
}
