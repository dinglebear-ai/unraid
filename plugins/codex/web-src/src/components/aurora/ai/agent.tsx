"use client"

import * as React from "react"
import { Bot, CircleDashed, CirclePlus, Clock, SquareCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/aurora/badge"
import { Spinner } from "@/components/ui/aurora/spinner"

export type AgentStatus = "idle" | "running" | "blocked" | "completed"

export interface AgentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Agent display name. */
  name: string
  /** Short role / responsibility line under the name. */
  role?: string
  /** Lifecycle status — drives the status pill and live affordances. */
  status?: AgentStatus
  /** Render the Axon-orange Agent identity chip beside the name. */
  badge?: boolean
  /** Model identifier shown in the metadata footer. */
  model?: string
  /** Current task description shown in the activity row. */
  task?: string
  /** Progress 0..1 — renders the determinate progress bar + percentage. */
  progress?: number
  /** Token usage shown in the footer (formatted to k). */
  tokens?: number
  /** Elapsed time string shown in the footer. */
  elapsed?: string
  /** Layout density. "compact" = single-line tile for grids. */
  variant?: "default" | "compact"
}

const statusTone: Record<AgentStatus, "info" | "success" | "warn" | "neutral"> = {
  running: "info",
  completed: "success",
  blocked: "warn",
  idle: "neutral",
}

const statusLabel: Record<AgentStatus, string> = {
  idle: "Idle",
  running: "Running",
  blocked: "Blocked",
  completed: "Completed",
}

function formatTokens(value: number): string {
  if (value >= 1000) {
    const k = value / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return String(value)
}

function panelStyle(style?: React.CSSProperties): React.CSSProperties {
  return {
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-default)",
    borderRadius: "var(--aurora-radius-1)",
    boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
    ...style,
  }
}

interface AvatarProps {
  status: AgentStatus
  size: number
}

function AgentAvatar({ status, size }: AvatarProps) {
  const dotSize = Math.round(size * 0.3)
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "calc(var(--aurora-radius-1) - 2px)",
        background: "var(--axon-orange-surface)",
        border: "1px solid var(--axon-orange-border)",
      }}
    >
      <Bot
        style={{
          width: Math.round(size * 0.5),
          height: Math.round(size * 0.5),
          color: "var(--axon-orange)",
        }}
      />
      {status === "running" ? (
        <span
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: "var(--axon-orange)",
            border: "2px solid var(--aurora-page-bg)",
            boxShadow: "0 0 8px color-mix(in srgb, var(--axon-orange) 60%, transparent)",
          }}
        />
      ) : null}
    </span>
  )
}

const Agent = (
    { ref,
      name,
      role,
      status = "idle",
      badge = false,
      model,
      task,
      progress,
      tokens,
      elapsed,
      variant = "default",
      className,
      style,
      ...props
    }: AgentProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const tone = statusTone[status]
    const hasProgress = typeof progress === "number"
    const pct = hasProgress ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : 0

    if (variant === "compact") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-3", className)}
          style={panelStyle({ padding: "12px 14px", ...style })}
          {...props}
        >
          <AgentAvatar status={status} size={36} />
          <span
            className="min-w-0 flex-1 truncate aurora-text-control"
            style={{ color: "var(--aurora-text-primary)", fontWeight: 700 }}
          >
            {name}
          </span>
          <Badge variant={tone} size="sm" dot={status === "running"}>
            {statusLabel[status]}
          </Badge>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col", className)}
        style={panelStyle({ padding: "16px 18px", gap: "14px", ...style })}
        {...props}
      >
        {/* Header */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
          <AgentAvatar status={status} size={52} />
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className="truncate aurora-text-section"
                style={{
                  color: "var(--aurora-text-primary)",
                }}
              >
                {name}
              </span>
              {badge ? (
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2 py-0.5 aurora-text-label"
                  style={{
                    borderColor: "var(--axon-orange-border)",
                    background: "var(--axon-orange-surface)",
                    color: "var(--axon-orange-strong)",
                    fontSize: "var(--aurora-type-micro)",
                    textTransform: "uppercase",
                  }}
                >
                  <Bot aria-hidden style={{ width: 11, height: 11 }} />
                  Agent
                </span>
              ) : null}
            </span>
            {role ? (
              <span
                className="block truncate aurora-text-body-sm"
                style={{
                  color: "var(--aurora-text-muted)",
                  marginTop: 2,
                }}
              >
                {role}
              </span>
            ) : null}
          </span>
          <Badge variant={tone} dot={status === "running" || status === "completed"}>
            {statusLabel[status]}
          </Badge>
        </div>

        {/* Activity */}
        {task ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {status === "running" ? (
                <Spinner size="sm" tone="muted" style={{ color: "var(--axon-orange)" }} />
              ) : (
                <CircleDashed
                  aria-hidden
                  style={{ width: 18, height: 18, color: "var(--aurora-text-muted)", flexShrink: 0 }}
                />
              )}
              <span
                className="min-w-0 flex-1 truncate aurora-text-ui"
                style={{ color: "var(--aurora-text-primary)" }}
              >
                {task}
              </span>
              {hasProgress ? (
                <span
                  style={{
                    color: "var(--aurora-text-muted)",
                    fontFamily: "var(--aurora-font-sans)",
                    fontSize: "var(--aurora-type-caption)",
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {pct}%
                </span>
              ) : null}
            </div>
            {hasProgress ? (
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: "color-mix(in srgb, var(--axon-orange) 14%, var(--aurora-control-surface))",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: 999,
                    background: "var(--axon-orange)",
                    boxShadow: "0 0 8px color-mix(in srgb, var(--axon-orange) 50%, transparent)",
                    transition: "width var(--motion-medium, 240ms) ease",
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Footer */}
        {model || typeof tokens === "number" || elapsed ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3"
            style={{ borderTop: "1px solid var(--aurora-border-default)", paddingTop: 12 }}
          >
            {model ? (
              <span className="flex min-w-0 items-center gap-2">
                <SquareCode
                  aria-hidden
                  style={{ width: 16, height: 16, color: "var(--aurora-text-muted)", flexShrink: 0 }}
                />
                <span
                  className="truncate aurora-text-meta"
                  style={{
                    color: "var(--aurora-text-muted)",
                  }}
                >
                  {model}
                </span>
              </span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-5">
              {typeof tokens === "number" ? (
                <span className="flex items-center gap-1.5">
                  <CirclePlus
                    aria-hidden
                    style={{ width: 16, height: 16, color: "var(--aurora-text-muted)", flexShrink: 0 }}
                  />
                  <span
                    className="aurora-text-meta"
                    style={{ color: "var(--aurora-text-primary)" }}
                  >
                    {formatTokens(tokens)}
                  </span>
                </span>
              ) : null}
              {elapsed ? (
                <span className="flex items-center gap-1.5">
                  <Clock
                    aria-hidden
                    style={{ width: 16, height: 16, color: "var(--aurora-text-muted)", flexShrink: 0 }}
                  />
                  <span
                    className="aurora-text-meta"
                    style={{ color: "var(--aurora-text-primary)" }}
                  >
                    {elapsed}
                  </span>
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
    )
  }
Agent.displayName = "Agent"

export { Agent }
export default Agent
