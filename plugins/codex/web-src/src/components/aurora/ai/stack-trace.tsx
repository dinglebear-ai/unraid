import * as React from "react"
import { CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/aurora/badge"

/**
 * StackTrace — an error stack-trace panel.
 *
 * Architecture is the canonical shadcn-registry pattern: a self-contained
 * `forwardRef` component with a typed prop API. Visuals match the Aurora /
 * Claude Design source 1:1 — a raised panel with a rose-tinted alert tile, a
 * bold display title, the error message in monospace, then numbered frames.
 * Each frame shows its index, the function name (cyan for app frames, dimmed
 * for vendor frames), an optional VENDOR tag, and the file:line:column origin.
 * Vendor frames (anything under `node_modules`) are dimmed and tagged.
 */

export interface StackFrame {
  /** Function / method name for this frame. */
  fn?: string
  /** Source file path. */
  file: string
  /** 1-based line number. */
  line?: number
  /** 1-based column number. */
  column?: number
  /**
   * Force the vendor treatment (dimmed row + VENDOR tag). When omitted it is
   * inferred from the file path (`node_modules`).
   */
  vendor?: boolean
  /** Optional secondary label rendered under the origin. */
  label?: string
}

export interface StackTraceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title shown beside the alert tile. */
  title?: string
  /** The error message rendered under the title. */
  error?: string
  /** Ordered stack frames, top of stack first. */
  frames: StackFrame[]
}

function isVendorFrame(frame: StackFrame): boolean {
  if (typeof frame.vendor === "boolean") return frame.vendor
  return /(^|\/)node_modules\//.test(frame.file)
}

function formatOrigin(frame: StackFrame): string {
  const line = frame.line != null ? `:${frame.line}` : ""
  const column = frame.column != null ? `:${frame.column}` : ""
  return `${frame.file}${line}${column}`
}

const StackTrace = ({ ref, className, title = "Stack Trace", error, frames, style, ...props }: StackTraceProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div
      ref={ref}
      className={cn("grid gap-3.5 p-4", className)}
      style={{
        background: "var(--aurora-surface-raised)",
        border: "1px solid var(--aurora-border-strong)",
        borderRadius: "var(--aurora-radius-1)",
        boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
        ...style,
      }}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid place-items-center shrink-0"
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: "var(--aurora-error-surface)",
            border: "1px solid var(--aurora-error-border)",
            color: "var(--aurora-error)",
          }}
        >
          <CircleAlert className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="aurora-text-section"
            style={{
              color: "var(--aurora-text-primary)",
            }}
          >
            {title}
          </div>
          {error ? (
            <div
              className="mt-1.5 break-words"
              style={{
                fontFamily: "var(--aurora-font-mono)",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--aurora-error)",
              }}
            >
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="overflow-hidden"
        style={{
          borderRadius: 10,
          border: "1px solid var(--aurora-border-default)",
        }}
      >
        {frames.map((frame, index) => {
          const vendor = isVendorFrame(frame)
          return (
            <div
              key={`${frame.file}-${index}`}
              className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3 px-4 py-3"
              style={{
                borderBottom:
                  index < frames.length - 1
                    ? "1px solid var(--aurora-border-default)"
                    : undefined,
                opacity: vendor ? 0.62 : 1,
              }}
            >
              <span
                className="text-right tabular-nums"
                style={{
                  fontFamily: "var(--aurora-font-mono)",
                  fontSize: 14,
                  color: "var(--aurora-text-muted)",
                }}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  {frame.fn ? (
                    <span
                      className="truncate"
                      style={{
                        fontFamily: "var(--aurora-font-mono)",
                        fontSize: 15,
                        fontWeight: 600,
                        color: vendor
                          ? "var(--aurora-text-muted)"
                          : "var(--aurora-code-function)",
                      }}
                    >
                      {frame.fn}
                    </span>
                  ) : null}
                  {vendor ? (
                    <Badge tone="neutral" size="sm">
                      Vendor
                    </Badge>
                  ) : null}
                </span>
                <span
                  className="mt-1 block truncate"
                  style={{
                    fontFamily: "var(--aurora-font-mono)",
                    fontSize: 14,
                    color: "var(--aurora-text-muted)",
                  }}
                >
                  {formatOrigin(frame)}
                </span>
                {frame.label ? (
                  <span className="mt-1 block aurora-text-meta">{frame.label}</span>
                ) : null}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
StackTrace.displayName = "StackTrace"

export { StackTrace }
