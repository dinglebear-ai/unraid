import * as React from "react"
import { cn } from "@/lib/utils"

function devWarn(message: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message)
  }
}

export type StatusTone = "online" | "syncing" | "queued" | "degraded" | "offline" | "error" | "automating"

export const toneColor: Record<StatusTone, { color: string; shadow: string }> = {
  online:     { color: "var(--aurora-success)",        shadow: "0 0 10px var(--aurora-success)" },
  syncing:    { color: "var(--aurora-info)",           shadow: "0 0 10px var(--aurora-info)" },
  queued:     { color: "var(--aurora-neutral)",        shadow: "0 0 10px var(--aurora-neutral)" },
  degraded:   { color: "var(--aurora-warn)",           shadow: "0 0 10px var(--aurora-warn)" },
  offline:    { color: "var(--aurora-neutral)",        shadow: "0 0 10px var(--aurora-neutral)" },
  error:      { color: "var(--aurora-error)",          shadow: "0 0 10px var(--aurora-error)" },
  automating: { color: "var(--axon-orange)",  shadow: "0 0 10px var(--axon-orange)" },
}

// queued and offline use --aurora-neutral-foreground so labels don't compete visually with the dot
const dimTones = new Set<StatusTone>(["queued", "offline"])

const pulseTones = new Set<StatusTone>(["syncing", "automating"])

const DEFAULT_LABEL: Record<StatusTone, string> = {
  online: "Online",
  syncing: "Syncing",
  queued: "Queued",
  degraded: "Degraded",
  offline: "Offline",
  error: "Error",
  automating: "Automating",
}

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone
  label?: React.ReactNode
  pulse?: boolean
  showLabel?: boolean
  dotClassName?: string
  /**
   * Inline dot overrides. Spread after the semantic tone colors so callers can
   * override background or boxShadow sparingly when a surface needs a one-off
   * visual treatment without changing the tone-to-color contract.
   */
  dotStyle?: React.CSSProperties
}

function StatusIndicator({
  className,
  tone = "online",
  label,
  pulse,
  showLabel = true,
  dotClassName,
  dotStyle,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: StatusIndicatorProps) {
  const safeTone = Object.hasOwn(toneColor, tone) ? tone : "online"
  if (tone !== safeTone) {
    devWarn(`[Aurora StatusIndicator] Unknown tone "${tone}". Valid values: ${Object.keys(toneColor).join(", ")}. Falling back to "online".`)
  }
  const resolvedPulse = pulse ?? pulseTones.has(safeTone)
  const { color, shadow } = toneColor[safeTone]
  const labelColor = dimTones.has(safeTone)
    ? "var(--aurora-neutral-foreground)"
    : "var(--aurora-text-primary)"
  const resolvedLabel = label ?? DEFAULT_LABEL[safeTone]
  const iconOnlyLabel =
    !showLabel && typeof resolvedLabel === "string" ? resolvedLabel : ariaLabel

  if (
    process.env.NODE_ENV !== "production" &&
    !showLabel &&
    !iconOnlyLabel &&
    !ariaLabelledBy
  ) {
    devWarn("[Aurora StatusIndicator] Icon-only indicators need a string `label`, `aria-label`, or `aria-labelledby`.")
  }

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={iconOnlyLabel}
      aria-labelledby={ariaLabelledBy}
      style={{
        color: labelColor,
        fontFamily: "var(--aurora-font-sans)",
        fontSize: "var(--aurora-type-body-sm)",
        fontWeight: "var(--aurora-weight-ui)",
        lineHeight: "var(--aurora-line-ui)",
        ...style,
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", resolvedPulse && "motion-safe:animate-pulse", dotClassName)}
        style={{ background: color, boxShadow: shadow, ...dotStyle }}
      />
      {showLabel ? resolvedLabel : null}
    </span>
  )
}

export { StatusIndicator }
export default StatusIndicator
