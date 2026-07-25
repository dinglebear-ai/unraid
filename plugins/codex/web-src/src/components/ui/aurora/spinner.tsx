"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Named tier ("sm" | "default" | "lg") or an explicit pixel diameter. */
  size?: "sm" | "default" | "lg" | number
  tone?: "cyan" | "rose" | "muted"
  /** Ring stroke width in px. */
  thickness?: number
}

const sizeMap = {
  sm: 14,
  default: 18,
  lg: 24,
}

const toneMap = {
  cyan: "var(--aurora-accent-primary)",
  rose: "var(--aurora-accent-pink)",
  muted: "var(--aurora-text-muted)",
}

function Spinner({ ref, className, size = "default", tone = "cyan", thickness = 2, style, ...props }: SpinnerProps & { ref?: React.Ref<HTMLSpanElement> }) {
  const px = typeof size === "number" ? size : sizeMap[size]
  const color = toneMap[tone]

  return (
    <span
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn("inline-block animate-spin rounded-full", className)}
      style={{
        color,
        width: px,
        height: px,
        border: `${thickness}px solid color-mix(in srgb, currentColor 18%, transparent)`,
        borderTopColor: "currentColor",
        boxShadow: "0 0 12px color-mix(in srgb, currentColor 22%, transparent)",
        ...style,
      }}
      {...props}
    />
  )
}

export { Spinner }
export default Spinner
