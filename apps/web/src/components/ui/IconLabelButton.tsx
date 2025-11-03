import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconLabelButtonVariants = cva(
  "inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface IconLabelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconLabelButtonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  label: string;
  showLabel?: boolean;
  iconPosition?: "left" | "right";
}

const IconLabelButton = React.forwardRef<
  HTMLButtonElement,
  IconLabelButtonProps
>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon,
      label,
      showLabel = true,
      iconPosition = "left",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(iconLabelButtonVariants({ variant, size, className }))}
        ref={ref}
        aria-label={label}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="icon-container" aria-hidden="true">
            {icon}
          </span>
        )}
        {showLabel && <span className="label-text">{label}</span>}
        {!showLabel && <span className="sr-only">{label}</span>}
        {icon && iconPosition === "right" && (
          <span className="icon-container" aria-hidden="true">
            {icon}
          </span>
        )}
      </Comp>
    );
  },
);

IconLabelButton.displayName = "IconLabelButton";

export { IconLabelButton, iconLabelButtonVariants };
