import * as React from "react"
import { Clock3, KeyRound, PlugZap, Server } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { StatusIndicator } from "@/components/ui/aurora/status-indicator"
import type { CodexState, McpDiagnosticStatus } from "@/protocol"

interface ConnectionDiagnosticsProps {
  state: CodexState
  open: boolean
  onOpenChange: (open: boolean) => void
}

function tone(status: string) {
  if (["connected", "working"].includes(status)) return "online" as const
  if (["connecting", "unknown"].includes(status)) return "syncing" as const
  if (status === "error") return "error" as const
  return "offline" as const
}

function mcpLabel(status: McpDiagnosticStatus) {
  if (status === "connected") return "Connected"
  if (status === "connecting") return "Connecting"
  if (status === "error") return "Attention"
  if (status === "disabled") return "Disabled"
  return "Unknown"
}

function timestamp(value: number | null) {
  if (!value) return "Not confirmed yet"
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))
}

export function ConnectionDiagnostics({ state, open, onOpenChange }: ConnectionDiagnosticsProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOpenChange(false)
    }
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      onOpenChange(false)
    }
    window.addEventListener("pointerdown", close, true)
    window.addEventListener("keydown", key, true)
    return () => {
      window.removeEventListener("pointerdown", close, true)
      window.removeEventListener("keydown", key, true)
    }
  }, [open, onOpenChange])

  const authLabel =
    state.requiresOpenaiAuth === false
      ? "Not required"
      : state.authenticated
        ? "Signed in"
        : state.requiresOpenaiAuth === true
          ? "Sign-in required"
          : "Checking"
  const authTone = state.authenticated || state.requiresOpenaiAuth === false ? "online" : "syncing"
  const lastSuccess = Math.max(
    state.diagnostics.appServerLastOkAtMs ?? 0,
    state.diagnostics.mcpLastOkAtMs ?? 0,
  ) || null

  return (
    <div className="uc-connection-menu" ref={ref}>
      <Button
        variant="plain"
        size="unstyled"
        className="uc-connection"
        type="button"
        aria-label={`Connection diagnostics. ${state.statusText}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        title="Connection diagnostics"
      >
        <StatusIndicator
          tone={tone(state.status)}
          label={state.statusText}
          showLabel={false}
          pulse={state.status === "connecting" || state.status === "working"}
        />
      </Button>
      {open ? (
        <div className="uc-header-popover uc-connection-popover" role="dialog" aria-label="Connection diagnostics">
          <div className="uc-diagnostics-heading">
            <div>
              <div className="aurora-text-label">Connection diagnostics</div>
              <div className="aurora-text-meta">Live status for this Codex session.</div>
            </div>
          </div>
          <div className="uc-diagnostic-list">
            <div className="uc-diagnostic-row">
              <Server size={15} aria-hidden />
              <div><strong>App server</strong><span>{state.statusText}</span></div>
              <StatusIndicator tone={tone(state.status)} label={state.statusText} showLabel={false} />
            </div>
            <div className="uc-diagnostic-row">
              <PlugZap size={15} aria-hidden />
              <div><strong>Unraid MCP</strong><span>{state.diagnostics.mcpMessage}</span></div>
              <StatusIndicator tone={tone(state.diagnostics.mcpStatus)} label={mcpLabel(state.diagnostics.mcpStatus)} showLabel={false} />
            </div>
            <div className="uc-diagnostic-row">
              <KeyRound size={15} aria-hidden />
              <div><strong>ChatGPT auth</strong><span>{authLabel}</span></div>
              <StatusIndicator tone={authTone} label={authLabel} showLabel={false} />
            </div>
            <div className="uc-diagnostic-row uc-diagnostic-time">
              <Clock3 size={15} aria-hidden />
              <div><strong>Last successful check</strong><span>{timestamp(lastSuccess)}</span></div>
            </div>
          </div>
          <div className="uc-diagnostic-timestamps aurora-text-meta">
            <span>App server: {timestamp(state.diagnostics.appServerLastOkAtMs)}</span>
            <span>Unraid MCP: {timestamp(state.diagnostics.mcpLastOkAtMs)}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
