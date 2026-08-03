import * as React from "react"
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FilePenLine,
  FileText,
  LoaderCircle,
  Search,
  Terminal,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"
import { EmptyState } from "@/components/ui/aurora/empty-state"
import {
  activityStatus,
  describeTool,
  groupConsecutiveCalls,
  summarizeToolActivity,
  type ToolCallGroup,
  type ToolCallModel,
} from "./tool-calls-model"

export type ToolCall = ToolCallModel

export interface ToolCallsProps {
  calls: ToolCall[]
}

function durationMs(call: ToolCall): number | null {
  if (!call.startedAt || !call.completedAt) return null
  return call.completedAt.getTime() - call.startedAt.getTime()
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function statusLabel(status: ToolCall["status"]): string {
  if (status === "running") return "Working"
  if (status === "error") return "Needs attention"
  return "Completed"
}

function StatusMark({ status }: { status: ToolCall["status"] }) {
  if (status === "running") {
    return <LoaderCircle className="aurora-tool-activity__status is-running" size={14} aria-hidden />
  }
  if (status === "error") {
    return <CircleAlert className="aurora-tool-activity__status is-error" size={14} aria-hidden />
  }
  return <CheckCircle2 className="aurora-tool-activity__status is-completed" size={14} aria-hidden />
}

function ToolIcon({ tool }: { tool: string }) {
  const normalized = tool.toLowerCase()
  const Icon = normalized.includes("read")
    ? FileText
    : normalized.includes("write")
      ? FilePenLine
      : normalized.includes("bash") ||
          normalized.includes("shell") ||
          normalized.includes("terminal")
        ? Terminal
        : normalized.includes("grep") ||
            normalized.includes("search") ||
            normalized.includes("lookup")
          ? Search
          : Wrench

  return <Icon size={14} strokeWidth={1.75} aria-hidden />
}

function DetailCard({
  label,
  children,
  tone,
}: {
  label: string
  children: React.ReactNode
  tone?: "error" | "default"
}) {
  return (
    <div className={`aurora-tool-detail-card${tone === "error" ? " is-error" : ""}`}>
      <span className="aurora-tool-detail-card__label">{label}</span>
      <pre>{children}</pre>
    </div>
  )
}

function ToolGroupDetails({ group }: { group: ToolCallGroup }) {
  const display = describeTool(group.tool)
  const totalDuration = group.calls.reduce((sum, call) => sum + (durationMs(call) ?? 0), 0)
  const hasDuration = group.calls.some((call) => durationMs(call) !== null)

  return (
    <details className="aurora-tool-group-detail" open={group.status === "error"}>
      <summary>
        <span className="aurora-tool-group-detail__icon" aria-hidden>
          <ToolIcon tool={group.tool} />
        </span>
        <span className="aurora-tool-group-detail__identity">
          <strong>{display.provider}</strong>
          {display.action ? <span>{display.action}</span> : null}
        </span>
        {group.calls.length > 1 ? (
          <Badge tone="neutral" fill="outline" shape="pill" size="sm">
            {group.calls.length}
          </Badge>
        ) : null}
        {hasDuration ? (
          <span className="aurora-tool-group-detail__duration">
            {formatDuration(totalDuration)}
          </span>
        ) : null}
        <StatusMark status={group.status} />
        <ChevronDown className="aurora-tool-group-detail__chevron" size={13} aria-hidden />
      </summary>

      <div className="aurora-tool-group-detail__body">
        {group.calls.map((call, index) => (
          <div className="aurora-tool-call-instance" key={call.id}>
            {group.calls.length > 1 ? (
              <div className="aurora-tool-call-instance__heading">
                <span>Call {index + 1}</span>
                <span>{statusLabel(call.status)}</span>
              </div>
            ) : null}
            <DetailCard label="Input">{JSON.stringify(call.args, null, 2)}</DetailCard>
            {call.result ? (
              <DetailCard label="Output" tone={call.status === "error" ? "error" : "default"}>
                {call.result}
              </DetailCard>
            ) : null}
          </div>
        ))}
      </div>
    </details>
  )
}

export function ToolCalls({ calls }: ToolCallsProps) {
  const groups = React.useMemo(() => groupConsecutiveCalls(calls), [calls])
  const status = activityStatus(calls)
  const [expanded, setExpanded] = React.useState(status === "error")
  const reactId = React.useId()
  const detailsId = `${reactId}-tool-activity-details`

  React.useEffect(() => {
    if (status === "error") setExpanded(true)
  }, [status])

  if (!calls.length) {
    return (
      <EmptyState
        icon={<Wrench size={26} strokeWidth={1.6} />}
        title="No tool calls yet."
        description="Tool activity appears here after Codex starts using connected capabilities."
        as="h3"
        className="aurora-tool-activity-empty"
      />
    )
  }

  const summary = summarizeToolActivity(calls)
  const countLabel = `${calls.length} ${calls.length === 1 ? "call" : "calls"}`

  return (
    <div className={`aurora-tool-activity is-${status}`} aria-busy={status === "running"}>
      <Button
        type="button"
        variant="plain"
        size="unstyled"
        className="aurora-tool-activity__trigger"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-label={`${summary}. ${statusLabel(status)}. ${countLabel}. ${expanded ? "Collapse" : "Expand"} details.`}
      >
        <StatusMark status={status} />
        <span className="aurora-tool-activity__copy">
          <span className="aurora-tool-activity__label">{summary}</span>
          <span className="aurora-tool-activity__meta">
            {statusLabel(status)} · {countLabel}
          </span>
        </span>
        <ChevronDown
          className="aurora-tool-activity__chevron"
          size={14}
          aria-hidden
          data-expanded={expanded ? "true" : "false"}
        />
      </Button>

      {expanded ? (
        <div
          id={detailsId}
          className="aurora-tool-activity__details"
          role="region"
          aria-label={`${summary} details`}
        >
          {groups.map((group) => (
            <ToolGroupDetails key={group.id} group={group} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ToolCalls
