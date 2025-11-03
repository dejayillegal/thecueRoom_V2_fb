
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Dynamic import with fallback to prevent build failures
let ProgressPrimitive: any = null;
try {
  ProgressPrimitive = require("@radix-ui/react-progress");
} catch (e) {
  ProgressPrimitive = {
    Root: React.forwardRef((props: any, ref: any) => (
      <div
        ref={ref}
        {...props}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
      />
    )),
    Indicator: React.forwardRef((props: any, ref: any) => (
      <div ref={ref} {...props} />
    )),
  };
  ProgressPrimitive.Root.displayName = "ProgressRoot";
  ProgressPrimitive.Indicator.displayName = "ProgressIndicator";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-[#1a1a1a]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-[#D7FF3C] transition-all duration-300"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
