"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ─── Fill color map ───────────────────────────────────────────────────────────

type ProgressVariant = "default" | "warn" | "error" | "rose"

const fillStyleMap: Record<ProgressVariant, React.CSSProperties> = {
  default: {
    background: "linear-gradient(90deg, var(--aurora-accent-button) 0%, var(--aurora-accent-lift) 60%, var(--aurora-accent-strong) 100%)",
    boxShadow: "0 0 8px color-mix(in srgb, var(--aurora-accent-primary) 50%, transparent), 0 0 2px var(--aurora-accent-primary)",
  },
  warn: {
    background: "linear-gradient(90deg, color-mix(in srgb, var(--aurora-warn) 72%, black) 0%, var(--aurora-warn) 100%)",
    boxShadow: "0 0 8px color-mix(in srgb, var(--aurora-warn) 40%, transparent)",
  },
  error: {
    background: "linear-gradient(90deg, color-mix(in srgb, var(--aurora-error) 72%, black) 0%, var(--aurora-error) 100%)",
    boxShadow: "0 0 8px color-mix(in srgb, var(--aurora-error) 40%, transparent)",
  },
  rose: {
    background: "linear-gradient(90deg, var(--aurora-accent-pink-deep) 0%, var(--aurora-accent-pink) 100%)",
    boxShadow: "0 0 8px color-mix(in srgb, var(--aurora-accent-pink) 40%, transparent)",
  },
}

const shimmerColorMap: Record<ProgressVariant, string> = {
  default: "color-mix(in srgb, var(--aurora-text-primary) 30%, transparent)",
  warn:    "color-mix(in srgb, var(--aurora-warn-foreground) 20%, transparent)",
  error:   "color-mix(in srgb, var(--aurora-error-foreground) 18%, transparent)",
  rose:    "color-mix(in srgb, var(--aurora-accent-pink-strong) 22%, transparent)",
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const heightMap = {
  sm: 4,
  default: 6,
  lg: 10,
} as const

type ProgressSize = keyof typeof heightMap

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. If undefined the bar is indeterminate. */
  value?: number
  /** Force indeterminate (loading) state regardless of value. */
  indeterminate?: boolean
  /** Color variant */
  variant?: ProgressVariant
  /**
   * Free-form fill color escape hatch (any CSS color, e.g.
   * `var(--aurora-success)`). When set it overrides `variant`'s gradient with
   * a matching single-tone fill + glow.
   */
  tone?: string
  /** Height preset */
  size?: ProgressSize
  /** Show percentage label */
  showLabel?: boolean
  /** Override label text */
  label?: string
  /** Max value (default 100) */
  max?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

function Progress(
  {
    ref,
    className,
    value,
    indeterminate,
    variant = "default",
    tone,
    size = "default",
    showLabel = false,
    label,
    max = 100,
    style,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-valuetext": ariaValueText,
    ...props
  }: ProgressProps & { ref?: React.Ref<HTMLDivElement> }
) {
    const isIndeterminate =
      indeterminate === true || value === undefined || value === null
    const clampedValue = isIndeterminate ? 0 : Math.min(Math.max(value ?? 0, 0), max)
    const percentage = isIndeterminate ? 0 : Math.round((clampedValue / max) * 100)
    const height = heightMap[size]
    const fillStyle: React.CSSProperties = tone
      ? {
          background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 72%, black) 0%, ${tone} 100%)`,
          boxShadow: `0 0 8px color-mix(in srgb, ${tone} 40%, transparent)`,
        }
      : fillStyleMap[variant]
    const shimmerColor = tone
      ? `color-mix(in srgb, ${tone} 22%, transparent)`
      : shimmerColorMap[variant]

    const displayLabel = label ?? `${percentage}%`

    return (
      <div
        className={cn("flex flex-col gap-1.5 w-full", className)}
        style={style}
        {...props}
      >
        {showLabel && (
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: "var(--aurora-type-caption)",
                fontFamily: "var(--aurora-font-sans)",
                fontWeight: "var(--aurora-weight-ui)",
                color: "var(--aurora-text-muted)",
                letterSpacing: 0,
              }}
            >
              {displayLabel}
            </span>
          </div>
        )}

        {/* Track */}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={isIndeterminate ? undefined : clampedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : isIndeterminate ? "Loading Progress" : "Progress")}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-valuetext={ariaValueText ?? (isIndeterminate ? "Loading" : displayLabel)}
          style={{
            height,
            borderRadius: height,
            background: "var(--aurora-control-surface)",
            border: "1px solid var(--aurora-border-default)",
            overflow: "hidden",
            position: "relative",
            width: "100%",
          }}
        >
          {/* Fill */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: "inherit",
              transition: isIndeterminate ? "none" : "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              width: isIndeterminate ? "40%" : `${percentage}%`,
              ...(isIndeterminate
                ? {
                    animation: "aurora-progress-indeterminate 1.6s ease-in-out infinite",
                  }
                : {}),
              ...fillStyle,
            }}
          >
            {/* Shimmer highlight */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
                animation: "aurora-progress-shimmer 2.2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>
    )
}

export { Progress }
export default Progress
