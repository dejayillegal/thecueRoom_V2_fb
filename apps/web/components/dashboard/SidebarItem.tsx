import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  expanded?: boolean;
  onClick?: () => void;
}

/**
 * Sidebar navigation item with icon and optional label
 * Accessible with aria-label and keyboard navigation support
 */
export const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ icon: Icon, label, href, active = false, expanded = false, onClick }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-2.5 py-2.5 text-gray-400',
          'hover:bg-white/5 hover:text-white',
          'transition-all duration-300 rounded-lg group relative overflow-hidden will-change-transform',
          'active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[var(--tcr-accent)] focus:ring-offset-2 focus:ring-offset-black',
          'min-h-[44px] touch-manipulation',
          active
            ? 'text-white bg-[var(--tcr-accent)]/10 font-bold'
            : 'text-gray-400 hover:bg-white/5 hover:text-white',
          !expanded && 'justify-center px-1'
        )}
        aria-label={label}
        title={!expanded ? label : undefined}
      >
        <Icon 
          size={20} 
          strokeWidth={active ? 2.5 : 2.2} 
          className={cn(
            "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            active ? "text-[var(--tcr-accent)] drop-shadow-[0_0_8px_rgba(215,255,60,0.4)]" : "text-gray-200 group-hover:text-white"
          )} 
          aria-hidden="true" 
        />
        {expanded && (
          <span className="text-xs tracking-tight whitespace-nowrap transition-opacity duration-300">
            {label}
          </span>
        )}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--tcr-accent)] rounded-r-full shadow-[0_0_10px_rgba(215,255,60,0.4)] z-10" />
        )}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>
    );
  }
);

SidebarItem.displayName = 'SidebarItem';
