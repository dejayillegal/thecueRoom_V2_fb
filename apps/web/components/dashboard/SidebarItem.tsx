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
          'flex items-center gap-2 px-2.5 py-2 text-[13px] transition-all duration-200 rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-[var(--tcr-accent)] focus:ring-offset-2 focus:ring-offset-black',
          'min-h-[44px] touch-manipulation',
          active
            ? 'bg-[var(--tcr-accent)] text-black font-medium'
            : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white',
          !expanded && 'justify-center'
        )}
        aria-label={label}
        title={!expanded ? label : undefined}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
        {expanded && <span>{label}</span>}
      </Link>
    );
  }
);

SidebarItem.displayName = 'SidebarItem';
