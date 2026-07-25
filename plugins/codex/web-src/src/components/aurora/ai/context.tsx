"use client"

import * as React from "react"
import { Layers2, X, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"

export interface ContextSegment {
  /** Display label, e.g. "System" */
  label: string
  /** Token count for this segment */
  value: number
  /** Optional explicit swatch color (defaults to the Aurora segment palette by index) */
  color?: string
}

export interface ContextPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Heading label (default "Context") */
  label?: string
  /** Total context window size in tokens */
  limit?: number
  /** Pre-summed used tokens. Ignored when `segments` is provided (sum is used instead). */
  used?: number
  /** Per-bucket breakdown that drives the segmented bar + legend */
  segments?: ContextSegment[]
  /** Tokens reserved for output — drawn as a hatched slice and surfaced in the legend/warning */
  reserved?: number
  /** Render the streaming shimmer on the leading segment */
  streaming?: boolean
  /** When provided, shows the "Compact" affordance in the header */
  onCompact?: () => void
  /** "default" (full panel) or "compact" (single inline row) */
  variant?: "default" | "compact"
  /** Token usage ratio (0–1) that flips the panel into its near-limit warning state. Default 0.9 */
  warnThreshold?: number
}

function panelStyle(style?: React.CSSProperties): React.CSSProperties {
  return {
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-strong)",
    borderRadius: "var(--aurora-radius-1)",
    boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
    ...style,
  }
}

function formatTokenCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return `${value}`
}

/** Aurora segment palette: cyan → teal → sand(axon-orange) → neutral, cycling. Violet dropped. */
const SEGMENT_COLORS = [
  "var(--aurora-accent-primary)",
  "var(--aurora-success)",
  "var(--axon-orange)",
  "var(--aurora-neutral)",
]

const HATCH_FILL =
  "repeating-linear-gradient(45deg, color-mix(in srgb, var(--aurora-text-muted) 22%, transparent) 0 4px, transparent 4px 8px)"

const ContextPanel = (
    { ref,
      label = "Context",
      limit = 128000,
      used,
      segments,
      reserved = 0,
      streaming = false,
      onCompact,
      variant = "default",
      warnThreshold = 0.9,
      className,
      style,
      ...props
    }: ContextPanelProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const segmentTotal = segments?.reduce((sum, s) => sum + s.value, 0) ?? 0
    const usedTokens = segments ? segmentTotal : used ?? 42100
    const safeLimit = limit > 0 ? limit : 1
    const percent = Math.min(Math.max((usedTokens / safeLimit) * 100, 0), 100)
    const remaining = Math.max(safeLimit - usedTokens, 0)
    const ratio = usedTokens / safeLimit
    const isWarning = ratio >= warnThreshold
    const stats = `${formatTokenCount(usedTokens)} / ${formatTokenCount(limit)} · ${Math.round(percent)}%`

    const headerLabel = (
      <div
        className="flex min-w-0 items-center gap-2 aurora-text-label"
        style={{ color: "var(--aurora-text-primary)", fontWeight: 700 }}
      >
        <Layers2 className="size-3.5 shrink-0" style={{ color: "var(--aurora-text-muted)" }} aria-hidden />
        <span className="truncate">{label}</span>
      </div>
    )

    const meterAria = {
      role: "meter" as const,
      "aria-label": label,
      "aria-valuemin": 0,
      "aria-valuemax": limit,
      "aria-valuenow": usedTokens,
      "aria-valuetext": `${formatTokenCount(usedTokens)} of ${formatTokenCount(limit)} tokens used`,
    }

    // ---- Compact variant: a single inline row ----
    if (variant === "compact") {
      return (
        <div
          ref={ref}
          className={["flex items-center gap-3 border px-3 py-2", className].filter(Boolean).join(" ")}
          style={{ ...panelStyle(style), width: "min(520px, 100%)" }}
          {...props}
        >
          {headerLabel}
          <div
            {...meterAria}
            className="min-w-0 flex-1"
            style={{
              height: 10,
              borderRadius: 999,
              background: "var(--aurora-control-surface)",
              overflow: "hidden",
              border: "1px solid var(--aurora-border-default)",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                borderRadius: 999,
                background: isWarning
                  ? "var(--aurora-error-gradient)"
                  : "linear-gradient(90deg, var(--aurora-accent-primary), var(--aurora-success))",
              }}
            />
          </div>
          {isWarning ? (
            <CircleAlert className="size-3.5 shrink-0" style={{ color: "var(--aurora-error)" }} aria-hidden />
          ) : null}
          <span
            className="aurora-text-meta shrink-0 tabular-nums"
            style={{
              color: "var(--aurora-text-muted)",
            }}
          >
            {stats}
          </span>
        </div>
      )
    }

    // ---- Default variant: full panel ----
    return (
      <div
        ref={ref}
        className={["grid gap-3 border p-4", className].filter(Boolean).join(" ")}
        style={{ ...panelStyle(style), width: "min(520px, 100%)" }}
        {...props}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {headerLabel}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            {onCompact ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCompact}
                iconLeft={<X aria-hidden />}
                style={{ color: "var(--axon-orange-strong)" }}
              >
                Compact
              </Button>
            ) : null}
            <span
              className="aurora-text-meta tabular-nums"
              style={{
                color: "var(--aurora-text-muted)",
              }}
            >
              {stats}
            </span>
          </div>
        </div>

        {/* Segmented bar */}
        <div
          {...meterAria}
          style={{
            height: 18,
            borderRadius: 999,
            background: "var(--aurora-control-surface)",
            overflow: "hidden",
            position: "relative",
            display: "flex",
          }}
        >
          {segments?.map((seg, i) => {
            const w = (seg.value / safeLimit) * 100
            const color = seg.color ?? SEGMENT_COLORS[i % SEGMENT_COLORS.length]
            return (
              <div
                key={`${seg.label}-${i}`}
                style={{
                  width: `${w}%`,
                  height: "100%",
                  background: color,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {streaming && i === 0 ? (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, transparent, color-mix(in srgb, var(--aurora-text-primary) 28%, transparent), transparent)",
                      animation: "aurora-context-shimmer 1.4s ease-in-out infinite",
                    }}
                  />
                ) : null}
              </div>
            )
          })}
          {reserved > 0 ? (
            <div
              aria-hidden="true"
              style={{
                width: `${(reserved / safeLimit) * 100}%`,
                height: "100%",
                background: HATCH_FILL,
                backgroundColor: "color-mix(in srgb, var(--aurora-control-surface) 70%, transparent)",
              }}
            />
          ) : null}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ fontSize: 14 }}>
          {segments?.map((seg, i) => {
            const segPct = Math.round((seg.value / safeLimit) * 100)
            const color = seg.color ?? SEGMENT_COLORS[i % SEGMENT_COLORS.length]
            return (
              <span key={`legend-${seg.label}-${i}`} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--aurora-text-muted)" }}>{seg.label}</span>
                <span
                  className="aurora-text-meta tabular-nums"
                  style={{ color: "var(--aurora-text-primary)", fontWeight: 600 }}
                >
                  {formatTokenCount(seg.value)}
                </span>
                <span className="tabular-nums" style={{ color: "var(--aurora-text-muted)" }}>
                  {segPct}%
                </span>
              </span>
            )
          })}
          {reserved > 0 ? (
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: HATCH_FILL,
                  backgroundColor: "color-mix(in srgb, var(--aurora-control-surface) 70%, transparent)",
                  border: "1px solid var(--aurora-border-default)",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "var(--aurora-text-muted)" }}>Reserved</span>
              <span
                className="aurora-text-meta tabular-nums"
                style={{ color: "var(--aurora-text-primary)", fontWeight: 600 }}
              >
                {formatTokenCount(reserved)}
              </span>
            </span>
          ) : null}
        </div>

        {/* "left" footer */}
        <div
          className="aurora-text-meta tabular-nums"
          style={{
            textAlign: "right",
            color: "var(--aurora-text-muted)",
          }}
        >
          {formatTokenCount(remaining)} left
        </div>

        {/* Near-limit warning */}
        {isWarning ? (
          <div
            className="flex items-center gap-2"
            role="status"
            style={{ color: "var(--aurora-error)", fontSize: 14, fontWeight: 500 }}
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            <span>
              Near context limit
              {reserved > 0 ? ` · ${formatTokenCount(reserved)} reserved for output` : null}
            </span>
          </div>
        ) : null}
      </div>
    )
  }
ContextPanel.displayName = "ContextPanel"

/** Alias kept for registry/back-compat parity with the shared barrel. */
const Context = ContextPanel

export { Context, ContextPanel }
