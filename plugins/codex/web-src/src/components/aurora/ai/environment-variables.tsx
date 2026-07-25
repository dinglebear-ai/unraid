"use client"

import * as React from "react"
import { Check, Copy, Eye, EyeOff, KeyRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"
import { Separator } from "@/components/ui/aurora/separator"
import { useClipboard } from "@/lib/aurora/use-clipboard"

export interface EnvironmentVariable {
  key: string
  value?: string
  secret?: boolean
  required?: boolean
}

export interface EnvironmentVariablesProps extends React.HTMLAttributes<HTMLDivElement> {
  variables: EnvironmentVariable[]
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

function maskValue(value: string): string {
  // Reveal a short prefix, then mask the remainder with dots — matches CD.
  const visible = value.slice(0, 6)
  return `${visible}${value.length > 6 ? "••••" : ""}`
}

function previewValue(value: string | undefined, secret: boolean, revealed: boolean): string {
  if (!value) return "Unset"
  if (secret && !revealed) return maskValue(value)
  return value.length > 18 ? `${value.slice(0, 18)}…` : value
}

function RowCopyButton({ value, label }: { value: string; label: string }) {
  const { copied, error, copy } = useClipboard(1200)
  const handleCopy = React.useCallback(() => void copy(value), [copy, value])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={copied ? `Copied ${label}` : error ? `Unable to copy ${label}` : `Copy ${label}`}
      style={{ height: 26, width: 26, borderRadius: 6 }}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden style={{ color: "var(--aurora-success)" }} />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </Button>
  )
}

const EnvironmentVariables = ({ ref, className, variables, style, ...props }: EnvironmentVariablesProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const [revealed, setRevealed] = React.useState(false)
    const hasSecret = variables.some((item) => item.secret)

    return (
      <div
        ref={ref}
        className={cn("grid gap-3 p-4", className)}
        style={panelStyle(style)}
        {...props}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
            <KeyRound className="size-4" aria-hidden style={{ color: "var(--aurora-accent-primary)" }} />
            <span style={{ color: "var(--aurora-text-primary)" }}>Environment</span>
            <span
              className="aurora-text-meta"
              style={{
                color: "var(--aurora-text-muted)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {variables.length}
            </span>
          </div>
          {hasSecret ? (
            <Button
              type="button"
              variant="neutral"
              size="icon"
              aria-pressed={revealed}
              aria-label={revealed ? "Hide secret values" : "Reveal secret values"}
              onClick={() => setRevealed((prev) => !prev)}
              style={{ height: 30, width: 30, borderRadius: 8 }}
            >
              {revealed ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </Button>
          ) : null}
        </div>
        <Separator />
        <div className="grid gap-1">
          {variables.map((item) => {
            const display = previewValue(item.value, Boolean(item.secret), revealed)
            return (
              <div
                key={item.key}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-[6px] px-2 py-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,168px)_auto]"
              >
                <span
                  className="truncate aurora-text-code"
                  style={{ color: "var(--aurora-text-primary)" }}
                >
                  {item.key}
                </span>
                <span
                  className="truncate aurora-text-code"
                  style={{
                    color: item.secret ? "var(--aurora-accent-pink)" : "var(--aurora-text-muted)",
                    justifySelf: "end",
                  }}
                >
                  {display}
                </span>
                <span className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                  {item.required ? <Badge variant="warn">Required</Badge> : null}
                  {item.secret ? <Badge variant="rose">Secret</Badge> : null}
                  {item.value ? <RowCopyButton value={item.value} label={item.key} /> : null}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
EnvironmentVariables.displayName = "EnvironmentVariables"

export { EnvironmentVariables }
export default EnvironmentVariables
