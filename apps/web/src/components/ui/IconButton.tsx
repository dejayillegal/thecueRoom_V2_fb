/**
 * IconButton component - Accessible button with icon + visible label
 * Enforces accessibility standards by requiring both icon and label
 * Replaces icon-only buttons throughout the application
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        accent: 'bg-[var(--tcr-accent)] text-black hover:bg-[var(--tcr-accent)]/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-sm',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Icon element or component */
  icon: React.ReactNode;
  /** Visible label text - required for accessibility */
  label: string;
  /** Whether to show label visually (always present for screen readers) */
  showLabel?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Position of icon relative to label */
  iconPosition?: 'left' | 'right';
}

/**
 * Accessible button component with icon and label
 * 
 * @example
 * ```tsx
 * <IconButton
 *   icon={<PlusIcon />}
 *   label="Add Item"
 *   onClick={handleClick}
 * />
 * ```
 * 
 * @example With icon only visually (label for screen readers)
 * ```tsx
 * <IconButton
 *   icon={<CloseIcon />}
 *   label="Close"
 *   showLabel={false}
 *   variant="ghost"
 *   size="icon"
 * />
 * ```
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      label,
      showLabel = true,
      loading = false,
      iconPosition = 'left',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={iconButtonVariants({ variant, size, className })}
        disabled={isDisabled}
        aria-label={label}
        {...props}
      >
        {loading ? (
          <>
            <span className="animate-spin" aria-hidden="true">
              ⟳
            </span>
            {showLabel && <span>{label}</span>}
            {!showLabel && <span className="sr-only">{label}</span>}
          </>
        ) : (
          <>
            {iconPosition === 'left' && (
              <span aria-hidden="true">{icon}</span>
            )}
            {showLabel ? (
              <span>{label}</span>
            ) : (
              <span className="sr-only">{label}</span>
            )}
            {iconPosition === 'right' && (
              <span aria-hidden="true">{icon}</span>
            )}
          </>
        )}
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Screen-reader only utility class
 * Should be added to tailwind.config if not present
 */
export const srOnly = 'sr-only';
