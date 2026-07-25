"use client"

import * as React from "react"
import { CircleCheck, FlaskConical, CircleMinus, CircleX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/aurora/badge"

export interface TestResult {
  name: string
  status: "passed" | "failed" | "skipped" | "running"
  duration?: string
  message?: string
}

export interface TestResultsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
  results: TestResult[]
}

const statusMeta = {
  passed: {
    color: "var(--aurora-success)",
    icon: CircleCheck,
    badge: "success" as const,
    label: "Passed",
  },
  failed: {
    color: "var(--aurora-error)",
    icon: CircleX,
    badge: "error" as const,
    label: "Failed",
  },
  skipped: {
    color: "var(--aurora-neutral)",
    icon: CircleMinus,
    badge: "neutral" as const,
    label: "Skipped",
  },
  running: {
    color: "var(--aurora-info)",
    icon: FlaskConical,
    badge: "info" as const,
    label: "Running",
  },
} as const

function panelStyle(style?: React.CSSProperties): React.CSSProperties {
  return {
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-strong)",
    borderRadius: "var(--aurora-radius-1)",
    boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
    ...style,
  }
}

const TestResults = ({ ref, className, results, style, ...props }: TestResultsProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const total = results.length
    const passed = results.filter((r) => r.status === "passed").length
    const failed = results.filter((r) => r.status === "failed").length
    const skipped = results.filter((r) => r.status === "skipped").length
    const running = results.filter((r) => r.status === "running").length

    const segments = [
      { count: passed, color: "var(--aurora-success)" },
      { count: failed, color: "var(--aurora-error)" },
      { count: running, color: "var(--aurora-info)" },
      { count: skipped, color: "var(--aurora-neutral)" },
    ].filter((s) => s.count > 0)

    return (
      <div
        ref={ref}
        className={cn("grid", className)}
        style={panelStyle({ gap: 14, padding: 16, ...style })}
        {...props}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center aurora-text-control"
            style={{ gap: 8, color: "var(--aurora-text-primary)", fontWeight: 600 }}
          >
            <FlaskConical
              className="size-4"
              aria-hidden
              style={{ color: "var(--aurora-text-muted)" }}
            />
            Test Results
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {passed > 0 ? <Badge variant="success">{passed} Passed</Badge> : null}
            {failed > 0 ? <Badge variant="error">{failed} Failed</Badge> : null}
            {running > 0 ? <Badge variant="info">{running} Running</Badge> : null}
            {skipped > 0 && passed === 0 && failed === 0 ? (
              <Badge variant="neutral">{skipped} Skipped</Badge>
            ) : null}
          </div>
        </div>

        {total > 0 ? (
          <div
            role="presentation"
            className="flex w-full overflow-hidden"
            style={{
              gap: 3,
              height: 4,
              borderRadius: 999,
              background: "var(--aurora-control-surface)",
            }}
          >
            {segments.map((segment, index) => (
              <span
                key={index}
                style={{
                  flex: segment.count,
                  background: segment.color,
                  borderRadius: 999,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="grid" style={{ gap: 2 }}>
          {results.length === 0 ? (
            <div
              className="rounded-[10px] px-3 py-2.5 aurora-text-body-sm"
              style={{
                border: "1px solid var(--aurora-border-default)",
                background: "var(--aurora-control-surface)",
                color: "var(--aurora-text-muted)",
              }}
            >
              No tests reported.
            </div>
          ) : null}
          {results.map((result) => {
            const meta = statusMeta[result.status]
            const StatusIcon = meta.icon
            return (
              <div
                key={result.name}
                className="grid items-center"
                style={{
                  gridTemplateColumns: "auto minmax(0,1fr) minmax(4.75rem,auto) auto",
                  columnGap: 12,
                  rowGap: 4,
                  borderRadius: 10,
                  padding: "8px 6px",
                  border: "1px solid",
                  borderColor:
                    result.status === "running"
                      ? "var(--aurora-info-border)"
                      : "transparent",
                  background:
                    result.status === "running"
                      ? "var(--aurora-info-surface)"
                      : "transparent",
                }}
              >
                <StatusIcon
                  className="size-4 shrink-0"
                  aria-hidden
                  style={{ color: meta.color }}
                />
                <span
                  className="truncate"
                  style={{
                    fontFamily: "var(--aurora-font-sans)",
                    fontSize: "var(--aurora-type-body-sm)",
                    fontWeight: "var(--aurora-weight-ui)",
                    color: "var(--aurora-text-primary)",
                  }}
                >
                  {result.name}
                </span>
                <span
                  className="aurora-text-meta"
                  style={{
                    justifySelf: "end",
                    color: "var(--aurora-text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {result.duration ?? ""}
                </span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Badge variant={meta.badge} dot={result.status === "running"}>
                    {meta.label}
                  </Badge>
                </div>
                {result.message ? (
                  <span
                    className="aurora-text-meta"
                    style={{ gridColumn: "2 / -1", color: "var(--aurora-text-muted)" }}
                  >
                    {result.message}
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
TestResults.displayName = "TestResults"

export { TestResults }
