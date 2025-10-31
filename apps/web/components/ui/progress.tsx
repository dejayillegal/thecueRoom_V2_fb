
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, size = 'md', label, ...props }, ref) => {
    const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
    const ariaValue = Math.max(0, Math.min(100, Math.round(value || 0)));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ariaValue}
        aria-label={label ?? 'progress'}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-800',
          heightClass,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex-1 bg-gradient-to-r from-[#D7FF3C] to-[#9B5CFF] transition-all duration-300',
            heightClass
          )}
          style={{ 
            width: `${ariaValue}%`,
            transform: `translateX(-${100 - ariaValue}%)`
          }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress as default };
