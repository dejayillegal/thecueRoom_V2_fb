"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Dynamic import with fallback to prevent build failures
let ProgressPrimitive: any = null;
try {
  ProgressPrimitive = require("@radix-ui/react-progress");
} catch (e) {
  // Fallback: simple progress component
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
