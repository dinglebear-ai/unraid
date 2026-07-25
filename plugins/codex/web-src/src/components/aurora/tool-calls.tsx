import * as React from "react"
import { ChevronDown, FilePenLine, FileText, Search, Terminal, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"
import { EmptyState } from "@/components/ui/aurora/empty-state"
import { groupConsecutiveCalls, summarizeToolCallGroup, type ToolCallGroup, type ToolCallModel } from "./tool-calls-model"

export type ToolCall = ToolCallModel

export interface ToolCallsProps {
  calls: ToolCall[]
}

const statusColor: Record<ToolCall["status"], string> = {
  running: "var(--axon-orange)",
  completed: "var(--aurora-success)",
  error: "var(--aurora-error)",
}

function durationMs(call: ToolCall): number | null {
  if (call.startedAt && call.completedAt) {
    return call.completedAt.getTime() - call.startedAt.getTime()
  }

  return null
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatToolSummary(tool: string): string {
  return tool
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      size={12}
      aria-hidden="true"
      style={{
        color: "var(--aurora-text-muted)",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.15s ease",
      }}
    />
  )
}

function StatusDot({ status }: { status: ToolCall["status"] }) {
  const color = statusColor[status]

  if (status === "running") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          width: 9,
          height: 9,
          borderRadius: "999px",
          border: `2px solid ${color}`,
          borderTopColor: "transparent",
          animation: "aurora-spin 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        width: 9,
        height: 9,
        borderRadius: "999px",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        flexShrink: 0,
      }}
    />
  )
}

function ToolIcon({ tool }: { tool: string }) {
  const normalized = tool.toLowerCase()
  const Icon = normalized.includes("read")
    ? FileText
    : normalized.includes("write")
    ? FilePenLine
    : normalized.includes("bash") || normalized.includes("shell") || normalized.includes("terminal")
    ? Terminal
    : normalized.includes("grep") || normalized.includes("search") || normalized.includes("lookup")
    ? Search
    : Wrench

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
        border: "1px solid var(--axon-orange-border)",
        background: "var(--axon-orange-surface)",
        color: "var(--axon-orange)",
        boxShadow: "var(--aurora-highlight-medium)",
        flexShrink: 0,
      }}
    >
      <Icon size={13} strokeWidth={1.8} />
    </span>
  )
}

function DetailCard({
  label,
  children,
  tone = "var(--aurora-text-primary)",
}: {
  label: string
  children: React.ReactNode
  tone?: string
}) {
  return (
    <div
      style={{
        background: "var(--aurora-panel-strong)",
        border: "1px solid var(--aurora-border-default)",
        borderRadius: 12,
        padding: "9px 11px",
        color: tone,
        fontSize: 12,
        whiteSpace: "pre-wrap",
        wordBreak: "normal",
        overflowWrap: "break-word",
        overflowX: "auto",
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: 6,
          color: "var(--aurora-text-muted)",
          fontFamily: "var(--aurora-font-sans)",
          fontSize: 10,
          letterSpacing: "var(--aurora-letter-eyebrow)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: "var(--aurora-font-mono)" }}>{children}</span>
    </div>
  )
}

function ToolCallRow({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = React.useState(false)
  const reactId = React.useId()
  const detailsId = `${reactId}-tool-call-details`
  const duration = durationMs(call)
  const summary = formatToolSummary(call.tool)

  return (
    <div
      aria-busy={call.status === "running"}
      style={{
        display: "block",
        width: expanded ? "min(100%, 560px)" : "fit-content",
        maxWidth: "100%",
        border: `1px solid ${expanded ? "var(--aurora-border-strong)" : "var(--aurora-border-default)"}`,
        borderRadius: expanded ? 16 : 999,
        background: expanded ? "var(--aurora-surface-raised)" : "var(--aurora-panel-strong)",
        boxShadow: expanded ? "var(--aurora-shadow-medium), var(--aurora-highlight-medium)" : "var(--aurora-highlight-medium)",
        overflow: "hidden",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
      }}
    >
      <Button
        variant="plain"
        size="unstyled"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-label={`${call.tool} tool call, ${call.status}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          width: expanded ? "100%" : "auto",
          maxWidth: "100%",
          minWidth: expanded ? undefined : "fit-content",
          padding: expanded ? "8px 12px" : "7px 10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <StatusDot status={call.status} />
        <ToolIcon tool={call.tool} />
        <span
          style={{
            minWidth: 0,
            color: expanded ? "var(--aurora-text-primary)" : "var(--aurora-text-muted)",
            fontSize: 12,
            fontWeight: expanded ? 650 : 600,
            lineHeight: 1.35,
            fontFamily: "var(--aurora-font-sans)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? call.tool : summary}
        </span>
        {expanded && duration !== null && (
          <span
            style={{
              color: "var(--aurora-text-muted)",
              fontSize: 11,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {formatDuration(duration)}
          </span>
        )}
        <span
          style={
            expanded
              ? {
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                }
              : {
                  display: "inline-flex",
                  alignItems: "center",
                }
          }
        >
          <Chevron expanded={expanded} />
        </span>
      </Button>

      {expanded && (
        <div
          id={detailsId}
          role="region"
          aria-label={`${call.tool} details`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 12px 12px",
          }}
        >
          <DetailCard label="Input">{JSON.stringify(call.args, null, 2)}</DetailCard>
          {call.result && (
            <DetailCard label="Output" tone={call.status === "error" ? "var(--aurora-error)" : "var(--aurora-text-primary)"}>
              {call.result}
            </DetailCard>
          )}
        </div>
      )}
    </div>
  )
}

function ToolCallGroupRow({ group }: { group: ToolCallGroup }) {
  const [expanded, setExpanded] = React.useState(false)
  const reactId = React.useId()
  const detailsId = `${reactId}-tool-call-group-details`
  const summary = formatToolSummary(summarizeToolCallGroup(group))
  const count = group.calls.length

  if (count === 1) {
    return <ToolCallRow call={group.calls[0]} />
  }

  return (
    <div
      aria-busy={group.status === "running"}
      style={{
        display: "block",
        width: expanded ? "min(100%, 560px)" : "fit-content",
        maxWidth: "100%",
        border: `1px solid ${expanded ? "var(--aurora-border-strong)" : "var(--aurora-border-default)"}`,
        borderRadius: expanded ? 16 : 999,
        background: expanded ? "var(--aurora-surface-raised)" : "var(--aurora-panel-strong)",
        boxShadow: expanded ? "var(--aurora-shadow-medium), var(--aurora-highlight-medium)" : "var(--aurora-highlight-medium)",
        overflow: "hidden",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
      }}
    >
      <Button
        variant="plain"
        size="unstyled"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-label={`${group.tool} tool calls, ${count} calls, ${group.status}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          width: expanded ? "100%" : "auto",
          maxWidth: "100%",
          minWidth: expanded ? undefined : "fit-content",
          padding: expanded ? "8px 12px" : "7px 10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <StatusDot status={group.status} />
        <ToolIcon tool={group.tool} />
        <span
          style={{
            minWidth: 0,
            color: expanded ? "var(--aurora-text-primary)" : "var(--aurora-text-muted)",
            fontSize: 12,
            fontWeight: expanded ? 650 : 600,
            lineHeight: 1.35,
            fontFamily: "var(--aurora-font-sans)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? group.tool : summary}
        </span>
        <Badge
          tone="neutral"
          fill="outline"
          shape="pill"
          size="sm"
          aria-label={`${count} grouped calls`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {count}
        </Badge>
        <span
          style={
            expanded
              ? {
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                }
              : {
                  display: "inline-flex",
                  alignItems: "center",
                }
          }
        >
          <Chevron expanded={expanded} />
        </span>
      </Button>

      {expanded && (
        <div
          id={detailsId}
          role="region"
          aria-label={`${group.tool} details`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 12px 12px",
          }}
        >
          {group.calls.map((call, index) => (
            <div
              key={call.id}
              style={{
                display: "grid",
                gap: 8,
                paddingTop: index === 0 ? 0 : 8,
                borderTop: index === 0 ? "none" : "1px solid var(--aurora-border-default)",
              }}
            >
              <div
                className="aurora-text-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: "var(--aurora-text-muted)",
                  fontSize: 11,
                }}
              >
                <StatusDot status={call.status} />
                <span>{call.tool}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>#{index + 1}</span>
              </div>
              <DetailCard label="Input">{JSON.stringify(call.args, null, 2)}</DetailCard>
              {call.result && (
                <DetailCard label="Output" tone={call.status === "error" ? "var(--aurora-error)" : "var(--aurora-text-primary)"}>
                  {call.result}
                </DetailCard>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

export function ToolCalls({ calls }: ToolCallsProps) {
  const groups = React.useMemo(() => groupConsecutiveCalls(calls), [calls])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        width: "100%",
      }}
    >
      {groups.map((group) => (
        <ToolCallGroupRow key={group.id} group={group} />
      ))}

      {calls.length === 0 && (
        <EmptyState
          icon={<Wrench size={26} strokeWidth={1.6} />}
          title="No tool calls yet."
          description="Tool activity appears here after the agent starts running commands."
          as="h3"
          style={{
            width: "100%",
            padding: "28px 24px",
            border: "1.5px dashed var(--aurora-border-default)",
            borderRadius: "var(--aurora-radius-2)",
            background: "var(--aurora-panel-medium)",
          }}
        />
      )}
    </div>
  )
}

export default ToolCalls
