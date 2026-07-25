import * as React from "react"
import { Clock, Database, Eye, Hexagon, RotateCcw, Save } from "lucide-react"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

/**
 * Checkpoint — a saved agent checkpoint card.
 *
 * Architecture is the canonical shadcn-registry pattern: a self-contained
 * `forwardRef` component with a typed prop API. Visuals match the Aurora /
 * Claude Design source 1:1 — a raised panel with a cyan save-icon tile, a
 * status badge, an optional "AUTO" tag, a monospace metadata row, and the
 * Diff / Restore action pair. A `compact` variant drops the meta + actions.
 */

export type CheckpointStatus = "current" | "saved" | "stale"

export interface CheckpointProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** Primary checkpoint label. */
  label: string
  /** Secondary description (default variant only). */
  description?: string
  /** Lifecycle status — drives the right-aligned badge. */
  status?: CheckpointStatus
  /** Step index this checkpoint captured. */
  step?: number
  /** Relative time the checkpoint was taken. */
  time?: string
  /** Human-readable snapshot size. */
  size?: string
  /** Render the "AUTO" tag beside the label. */
  badge?: boolean
  /** Layout density. `compact` = single dense row, no meta/actions. */
  variant?: "default" | "compact"
  /** Diff / view-changes action. Renders the "Diff" button when provided. */
  onView?: () => void
  /** Restore-to-checkpoint action. Renders the "Restore" button when provided. */
  onRestore?: () => void
  /** Whole-card click (compact variant — makes the row interactive). */
  onClick?: () => void
}

const STATUS_LABEL: Record<CheckpointStatus, string> = {
  current: "Current",
  saved: "Saved",
  stale: "Stale",
}

const STATUS_TONE = {
  current: "success",
  saved: "neutral",
  stale: "warn",
} as const

function MetaItem({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span
      className="aurora-text-meta inline-flex items-center gap-1.5 tabular-nums"
      style={{ color: "var(--aurora-text-muted)" }}
    >
      <Icon className="size-3.5" aria-hidden style={{ color: "var(--aurora-text-muted)", opacity: 0.85 }} />
      {children}
    </span>
  )
}

function AutomationTag() {
  return (
    <span
      className="aurora-text-caption inline-flex shrink-0 items-center rounded-[4px] border px-1.5 py-0.5"
      style={{
        color: "var(--axon-orange-strong)",
        background: "var(--axon-orange-surface)",
        borderColor: "var(--axon-orange-border)",
        fontWeight: 700,
        letterSpacing: "0.075em",
        textTransform: "uppercase",
      }}
    >
      Auto
    </span>
  )
}

const Checkpoint = (
    { ref,
      label,
      description,
      status = "saved",
      step,
      time,
      size,
      badge = false,
      variant = "default",
      onView,
      onRestore,
      onClick,
      className,
      style,
      ...props
    }: CheckpointProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const compact = variant === "compact"
    const interactive = compact && typeof onClick === "function"

    const tile = (
      <span
        aria-hidden
        className="grid place-items-center shrink-0"
        style={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          borderRadius: 12,
          background: "var(--axon-orange-surface)",
          border: "1px solid var(--axon-orange-border)",
          color: "var(--axon-orange)",
        }}
      >
        <Save className={compact ? "size-4" : "size-5"} />
      </span>
    )

    const statusBadge = (
      <Badge variant={STATUS_TONE[status]} style={{ letterSpacing: "0.14em" }}>
        {STATUS_LABEL[status]}
      </Badge>
    )

    const cardStyle: React.CSSProperties = {
      background: "var(--aurora-surface-raised)",
      border: "1px solid var(--aurora-border-strong)",
      borderRadius: "var(--aurora-radius-1)",
      boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
      transition: interactive
        ? "border-color var(--motion-duration-fast) var(--motion-ease-out), background var(--motion-duration-fast) var(--motion-ease-out)"
        : undefined,
      ...style,
    }

    if (compact) {
      return (
        <div
          ref={ref}
          className={["flex items-center gap-3 p-3", interactive ? "cursor-pointer aurora-checkpoint--interactive" : "", className]
            .filter(Boolean)
            .join(" ")}
          style={cardStyle}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          onClick={onClick}
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onClick?.()
                  }
                }
              : undefined
          }
          {...props}
        >
          {tile}
          <div
            className="min-w-0 flex-1 truncate"
            style={{
              fontFamily: "var(--aurora-font-display)",
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: 0,
              color: "var(--aurora-text-primary)",
            }}
          >
            {label}
          </div>
          {statusBadge}
        </div>
      )
    }

    const showMeta = step != null || time != null || size != null
    const showActions = typeof onView === "function" || typeof onRestore === "function"

    return (
      <div ref={ref} className={["grid gap-3 p-4", className].filter(Boolean).join(" ")} style={cardStyle} {...props}>
        <div className="flex items-start gap-3">
          {tile}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span
                className="truncate"
                style={{
                  fontFamily: "var(--aurora-font-display)",
                  fontSize: 19,
                  fontWeight: 700,
                  letterSpacing: 0,
                  color: "var(--aurora-text-primary)",
                }}
              >
                {label}
              </span>
              {badge ? <AutomationTag /> : null}
            </div>
            {description ? (
              <div className="aurora-text-body-sm mt-1" style={{ color: "var(--aurora-text-muted)" }}>
                {description}
              </div>
            ) : null}
          </div>
          <div className="self-start">{statusBadge}</div>
        </div>

        {showMeta || showActions ? (
          <div style={{ height: 1, background: "var(--aurora-border-default)", opacity: 0.7 }} />
        ) : null}

        {showMeta || showActions ? (
          <div className="flex items-center gap-5">
            {showMeta ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-5">
                {step != null ? <MetaItem icon={Hexagon}>Step {step}</MetaItem> : null}
                {time != null ? <MetaItem icon={Clock}>{time}</MetaItem> : null}
                {size != null ? <MetaItem icon={Database}>{size}</MetaItem> : null}
              </div>
            ) : (
              <span className="flex-1" />
            )}
            {showActions ? (
              <div className="flex items-center gap-2.5">
                {typeof onView === "function" ? (
                  <Button type="button" variant="ghost" size="sm" iconLeft={<Eye aria-hidden />} onClick={onView}>
                    Diff
                  </Button>
                ) : null}
                {typeof onRestore === "function" ? (
                  <Button type="button" variant="aurora" size="sm" iconLeft={<RotateCcw aria-hidden />} onClick={onRestore}>
                    Restore
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }
Checkpoint.displayName = "Checkpoint"

export { Checkpoint }
