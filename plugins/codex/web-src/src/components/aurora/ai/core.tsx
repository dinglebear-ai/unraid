import * as React from "react"
import {
  Bot,
  Boxes,
  Check,
  Copy,
  CircleCheck,
  CircleAlert,
  CircleDashed,
  ExternalLink,
  FileCode,
  FileText,
  FlaskConical,
  GitCommitHorizontal,
  KeyRound,
  Layers2,
  ListChecks,
  Mic,
  Network,
  Package,
  Play,
  Route,
  Save,
  Send,
  Sparkles,
  UserRound,
  Workflow,
  X,
  CircleX,
} from "lucide-react"
import { Avatar as AuroraAvatar } from "@/components/ui/aurora/avatar"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"
import { useClipboard } from "@/lib/aurora/use-clipboard"
import { safeHttpUrl } from "@/lib/aurora/safe-url"
import { Separator } from "@/components/ui/aurora/separator"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/aurora/select"
import { Spinner } from "@/components/ui/aurora/spinner"
import { Textarea } from "@/components/ui/aurora/textarea"
import { cn } from "@/lib/utils"

export interface MessageProps extends React.HTMLAttributes<HTMLElement> {
  role?: "assistant" | "user" | "system"
}

export interface MessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  tone?: "cyan" | "rose" | "muted" | "orange"
}

export interface SourcesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
}

export interface SourceItem {
  title: string
  href?: string
  description?: string
  badge?: string
}

export interface SourceProps extends React.HTMLAttributes<HTMLAnchorElement> {
  source: SourceItem
}

export interface InlineCitationProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  index: number
}

export interface AgentTask {
  id: string
  title: string
  description?: string
  status: "queued" | "running" | "completed" | "failed"
}

export interface TaskListProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks: AgentTask[]
}

export interface TestResult {
  name: string
  status: "passed" | "failed" | "skipped" | "running"
  duration?: string
  message?: string
}

export interface TestResultsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
  results: TestResult[]
}

export interface StackFrame {
  file: string
  line?: number
  column?: number
  label?: string
}

export interface StackTraceProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  frames: StackFrame[]
}

export interface EnvironmentVariable {
  key: string
  value?: string
  secret?: boolean
  required?: boolean
}

export interface EnvironmentVariablesProps extends React.HTMLAttributes<HTMLDivElement> {
  variables: EnvironmentVariable[]
}

export interface CheckpointProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  description?: string
}

export interface ConfirmationProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface ContextPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  used?: number
  limit?: number
  label?: string
}

export type ConversationProps = React.HTMLAttributes<HTMLDivElement>

export interface ModelSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  models: string[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  label?: string
  name?: string
  disabled?: boolean
  required?: boolean
  triggerId?: string
  triggerLabel?: string
}

export interface QueueProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks: AgentTask[]
}

export interface SuggestionOption {
  id: string
  title: string
  description?: string
  badge?: string
}

export interface SuggestionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  options?: SuggestionOption[]
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export interface AgentProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  role?: string
  status?: "idle" | "running" | "blocked"
}

export interface CommitProps extends React.HTMLAttributes<HTMLDivElement> {
  hash: string
  message: string
  author?: string
}

export interface JsxPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string
}

export interface PackageInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  version: string
  description?: string
}

export interface SandboxProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  command?: string
  status?: "ready" | "running" | "idle"
  runtime?: string
  paths?: string[]
  envCount?: number
}

export interface SchemaDisplayProps extends React.HTMLAttributes<HTMLPreElement> {
  schema: unknown
}

export interface SnippetProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string
  language?: string
}

export interface AuroraImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  caption?: string
}

export type OpenInChatProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export interface AudioPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  duration?: string
}

export interface MicSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  devices: string[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  required?: boolean
  triggerId?: string
  triggerLabel?: string
}

export interface PersonaProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  description?: string
}

export type SpeechInputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export interface TranscriptionSegment {
  speaker: string
  timecode: string
  text: string
  confidence?: number
}

export interface TranscriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: TranscriptionSegment[]
}

export interface VoiceSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  voices: string[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  required?: boolean
  triggerId?: string
  triggerLabel?: string
}

export type CanvasProps = React.HTMLAttributes<HTMLDivElement>
export interface ConnectionProps extends React.HTMLAttributes<HTMLDivElement> {
  from: string
  to: string
}
export type ControlsProps = React.HTMLAttributes<HTMLDivElement>
export interface EdgeProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}
export interface NodeProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}
export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
}

const taskTone = {
  queued: { color: "var(--aurora-text-muted)", icon: <CircleDashed className="size-4" aria-hidden /> },
  running: { color: "var(--axon-orange)", icon: <Spinner size="sm" /> },
  completed: { color: "var(--aurora-success)", icon: <CircleCheck className="size-4" aria-hidden /> },
  failed: { color: "var(--aurora-error)", icon: <CircleX className="size-4" aria-hidden /> },
}

const resultVariant = {
  passed: "success",
  failed: "error",
  skipped: "neutral",
  running: "neutral",
} as const

function formatStatusLabel(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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

function previewValue(value?: string, secret?: boolean) {
  if (!value) return "Unset"
  if (secret) {
    const visible = value.slice(0, 6)
    return `${visible}${value.length > 6 ? "••••" : ""}`
  }
  return value.length > 18 ? `${value.slice(0, 18)}…` : value
}

function formatTokenCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return `${value}`
}

function stringifyWithOrder(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function renderJsonValue(value: unknown, depth = 0): React.ReactNode {
  const indent = "  ".repeat(depth)

  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: "var(--aurora-text-muted)" }}>[]</span>
    return (
      <>
        <span style={{ color: "var(--aurora-text-muted)" }}>[</span>
        {"\n"}
        {value.map((item, index) => (
          <React.Fragment key={index}>
            {indent}
            {"  "}
            {renderJsonValue(item, depth + 1)}
            {index < value.length - 1 ? <span style={{ color: "var(--aurora-text-muted)" }}>,</span> : null}
            {"\n"}
          </React.Fragment>
        ))}
        {indent}
        <span style={{ color: "var(--aurora-text-muted)" }}>]</span>
      </>
    )
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
    if (entries.length === 0) return <span style={{ color: "var(--aurora-text-muted)" }}>{`{}`}</span>
    return (
      <>
        <span style={{ color: "var(--aurora-text-muted)" }}>{`{`}</span>
        {"\n"}
        {entries.map(([key, entryValue], index) => (
          <React.Fragment key={key}>
            {indent}
            {"  "}
            <span style={{ color: "var(--aurora-accent-primary)" }}>{`"${key}"`}</span>
            <span style={{ color: "var(--aurora-text-muted)" }}>: </span>
            {renderJsonValue(entryValue, depth + 1)}
            {index < entries.length - 1 ? <span style={{ color: "var(--aurora-text-muted)" }}>,</span> : null}
            {"\n"}
          </React.Fragment>
        ))}
        {indent}
        <span style={{ color: "var(--aurora-text-muted)" }}>{`}`}</span>
      </>
    )
  }

  if (typeof value === "string") return <span style={{ color: "var(--aurora-accent-pink)" }}>{`"${value}"`}</span>
  if (typeof value === "number") return <span style={{ color: "var(--aurora-warn)" }}>{value}</span>
  if (typeof value === "boolean") return <span style={{ color: "var(--aurora-success)" }}>{String(value)}</span>
  if (value === null) return <span style={{ color: "var(--aurora-text-muted)" }}>null</span>
  return <span style={{ color: "var(--aurora-text-primary)" }}>{String(value)}</span>
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const { copied, error, copy } = useClipboard(1200)
  const handleCopy = React.useCallback(() => void copy(value), [copy, value])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : error ? "Unable to copy" : label}
    >
      {copied ? (
        <Check className="size-3.5" data-icon="inline-start" aria-hidden />
      ) : (
        <Copy className="size-3.5" data-icon="inline-start" aria-hidden />
      )}
      <span aria-live="polite" aria-atomic="true">{copied ? "Copied" : error ? "Unable to copy" : label}</span>
    </Button>
  )
}

function CodeSurface({
  icon,
  title,
  value,
  children,
}: {
  icon: React.ReactNode
  title: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-3 rounded-[8px] border p-3" style={panelStyle()}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
          {icon}
          {title}
        </div>
        <CopyButton value={value} />
      </div>
      {children}
    </div>
  )
}

function SelectorCard({
  icon,
  title,
  description,
  values,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  required,
  triggerId,
  triggerLabel,
  placeholder,
}: {
  icon: React.ReactNode
  title: string
  description: string
  values: string[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
  required?: boolean
  triggerId?: string
  triggerLabel?: string
  placeholder?: string
}) {
  return (
    <div className="grid gap-3 rounded-[8px] border p-3" style={panelStyle()}>
      <div className="grid gap-1">
        <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
          {icon}
          {title}
        </div>
        <p className="aurora-text-meta" style={{ margin: 0 }}>
          {description}
        </p>
      </div>
      <Select value={value} defaultValue={defaultValue ?? values[0]} onValueChange={onValueChange} name={name} disabled={disabled} required={required}>
        <SelectTrigger id={triggerId} aria-label={triggerLabel ?? title} className="h-10 rounded-[10px]">
          <SelectValue placeholder={placeholder ?? values[0]} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {values.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

const Message = ({ ref, className, role = "assistant", style, ...props }: MessageProps & { ref?: React.Ref<HTMLElement> }) => (
  <article
    ref={ref}
    className={cn(
      "grid grid-cols-[auto_minmax(0,1fr)] gap-3",
      className
    )}
    data-role={role}
    style={{
      color: "var(--aurora-text-primary)",
      alignItems: "start",
      ...style,
    }}
    {...props}
  />
)
Message.displayName = "Message"

const MessageAvatar = ({ ref, className, label, tone = "orange", style, ...props }: MessageAvatarProps & { ref?: React.Ref<React.ElementRef<typeof AuroraAvatar>> }) => {
    const color =
      tone === "rose"
        ? "var(--aurora-accent-pink)"
        : tone === "muted"
          ? "var(--aurora-text-muted)"
          : tone === "cyan"
            ? "var(--aurora-accent-primary)"
            : "var(--axon-orange)"

    return (
      <AuroraAvatar
        ref={ref}
        variant="bot"
        size={34}
        alt={label}
        fallback={label.slice(0, 2).toUpperCase()}
        className={className}
        style={{
          borderColor: `color-mix(in srgb, ${color} 35%, var(--aurora-border-default))`,
          background: `color-mix(in srgb, ${color} 13%, var(--aurora-panel-medium))`,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 8%, transparent), var(--aurora-highlight-medium)`,
          color,
          fontFamily: "var(--aurora-font-display)",
          fontSize: 12,
          fontWeight: 800,
          ...style,
        }}
        {...props}
      />
    )
  }
MessageAvatar.displayName = "MessageAvatar"

const bubbleTone = {
  assistant: {
    background: "linear-gradient(180deg, color-mix(in srgb, var(--axon-orange) 10%, var(--aurora-panel-medium)), color-mix(in srgb, var(--axon-orange) 5%, var(--aurora-panel-medium)))",
    borderColor: "color-mix(in srgb, var(--axon-orange) 30%, var(--aurora-border-default))",
    shadow: "0 14px 30px color-mix(in srgb, var(--axon-orange) 7%, transparent), var(--aurora-highlight-medium)",
  },
  user: {
    background: "linear-gradient(180deg, color-mix(in srgb, var(--aurora-accent-primary) 13%, var(--aurora-panel-medium)), color-mix(in srgb, var(--aurora-accent-primary) 7%, var(--aurora-panel-medium)))",
    borderColor: "color-mix(in srgb, var(--aurora-accent-primary) 36%, var(--aurora-border-default))",
    shadow: "0 14px 30px color-mix(in srgb, var(--aurora-accent-primary) 7%, transparent), var(--aurora-highlight-medium)",
  },
  system: {
    background: "color-mix(in srgb, var(--aurora-text-muted) 8%, var(--aurora-panel-medium))",
    borderColor: "var(--aurora-border-default)",
    shadow: "var(--aurora-highlight-medium)",
  },
} as const

const MessageContent = ({ ref, className, style, tone = "assistant", ...props }: React.HTMLAttributes<HTMLDivElement> & { tone?: MessageProps["role"] } & { ref?: React.Ref<HTMLDivElement> }) => (
    <div
      ref={ref}
      className={cn(
        "min-w-0 border px-4 py-3 aurora-text-body",
        tone === "user" ? "rounded-[16px_16px_6px_16px]" : "rounded-[16px_16px_16px_6px]",
        className
      )}
      style={{
        background: bubbleTone[tone].background,
        borderColor: bubbleTone[tone].borderColor,
        boxShadow: bubbleTone[tone].shadow,
        lineHeight: "var(--aurora-line-body)",
        ...style,
      }}
      {...props}
    />
  )
MessageContent.displayName = "MessageContent"

// LEARNED: umbrella registry exports need the same URL boundary as standalone blocks.
const InlineCitation = ({ ref, className, index, style, children, href, ...props }: InlineCitationProps & { ref?: React.Ref<HTMLAnchorElement> }) => (
    <a
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-[4px] border px-1.5 py-0.5 align-baseline no-underline",
        "transition-colors hover:bg-[var(--aurora-hover-bg)]",
        "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-offset-0",
        className
      )}
      style={{
        borderColor: "color-mix(in srgb, var(--aurora-accent-primary) 34%, transparent)",
        color: "var(--aurora-accent-strong)",
        fontFamily: "var(--aurora-font-sans)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "var(--aurora-letter-label)",
        lineHeight: 1,
        ...style,
      }}
      {...props}
      href={safeHttpUrl(href)}
    >
      {children ?? index}
    </a>
  )
InlineCitation.displayName = "InlineCitation"

const Sources = ({ ref, className, title = "Sources", style, children, ...props }: SourcesProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn("grid gap-2 border p-3", className)} style={panelStyle(style)} {...props}>
    <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
      <FileText className="size-3.5" aria-hidden />
      {title}
    </div>
    <div className="grid gap-2">{children}</div>
  </div>
)
Sources.displayName = "Sources"

const Source = ({ ref, className, source, style, ...props }: SourceProps & { ref?: React.Ref<HTMLAnchorElement> }) => (
  <a
    ref={ref}
    className={cn(
      "grid gap-1 rounded-[7px] border px-3 py-2 no-underline transition-colors hover:bg-[var(--aurora-hover-bg)]",
      "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-offset-0",
      className
    )}
    style={{
      borderColor: "var(--aurora-border-default)",
      color: "var(--aurora-text-primary)",
      ...style,
    }}
    {...props}
    href={safeHttpUrl(source.href)}
  >
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate aurora-text-control">{source.title}</span>
      {source.badge ? <Badge shape="tag">{source.badge}</Badge> : null}
      <ExternalLink className="ml-auto size-3.5 shrink-0" aria-hidden style={{ color: "var(--aurora-text-muted)" }} />
    </span>
    {source.description ? <span className="aurora-text-meta">{source.description}</span> : null}
  </a>
)
Source.displayName = "Source"

const TaskList = ({ ref, className, tasks, style, ...props }: TaskListProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn("grid gap-2 border p-3", className)} style={panelStyle(style)} {...props}>
    <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
      <ListChecks className="size-3.5" aria-hidden />
      Tasks
    </div>
    <Separator />
    <div className="grid gap-2">
      {tasks.map((task) => {
        const tone = taskTone[task.status]
        return (
          <div
            key={task.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-[10px] border px-2 py-2"
            style={{
              color: tone.color,
              borderColor: task.status === "running" ? "color-mix(in srgb, var(--axon-orange) 30%, transparent)" : "transparent",
              background: task.status === "running" ? "color-mix(in srgb, var(--axon-orange) 10%, var(--aurora-panel-medium))" : "transparent",
            }}
          >
            <span className="mt-0.5">{tone.icon}</span>
            <span className="min-w-0">
              <span className="block truncate aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{task.title}</span>
              {task.description ? <span className="block aurora-text-meta">{task.description}</span> : null}
            </span>
            <Badge tone={task.status === "failed" ? "error" : task.status === "completed" ? "success" : task.status === "running" ? "warn" : "neutral"}>
              {formatStatusLabel(task.status)}
            </Badge>
          </div>
        )
      })}
    </div>
  </div>
)
TaskList.displayName = "TaskList"

const TestResults = ({ ref, className, results, style, ...props }: TestResultsProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn("grid gap-2 border p-3", className)} style={panelStyle(style)} {...props}>
    <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
      <FlaskConical className="size-3.5" aria-hidden />
      Test Results
    </div>
    <Separator />
    <div className="grid gap-1">
      {results.map((result) => (
        <div
          key={result.name}
          className="grid grid-cols-[minmax(0,1fr)_72px_96px] items-start gap-3 rounded-[10px] border px-2 py-1.5"
          style={{
            borderColor: result.status === "running" ? "color-mix(in srgb, var(--axon-orange) 30%, transparent)" : "transparent",
            background: result.status === "running" ? "color-mix(in srgb, var(--axon-orange) 10%, var(--aurora-panel-medium))" : "transparent",
          }}
        >
          <span className="truncate aurora-text-control" style={{ color: "var(--aurora-text-primary)", paddingTop: 4 }}>{result.name}</span>
          <span className="aurora-text-meta" style={{ justifySelf: "end", minHeight: 20, paddingTop: 4 }}>{result.duration ?? ""}</span>
          <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 24 }}>
            <Badge tone={resultVariant[result.status]} dot={result.status === "running"}>
              {formatStatusLabel(result.status)}
            </Badge>
          </div>
          {result.message ? <span className="col-span-3 aurora-text-meta" style={{ paddingTop: 2 }}>{result.message}</span> : null}
        </div>
      ))}
    </div>
  </div>
)
TestResults.displayName = "TestResults"

const StackTrace = ({ ref, className, title = "Stack Trace", frames, style, ...props }: StackTraceProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn("grid gap-2 border p-3", className)} style={panelStyle(style)} {...props}>
    <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-error)" }}>
      <CircleAlert className="size-3.5" aria-hidden />
      {title}
    </div>
    <div className="overflow-hidden rounded-[7px] border" style={{ borderColor: "var(--aurora-border-default)" }}>
      {frames.map((frame, index) => (
        <div key={`${frame.file}-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b px-3 py-2 last:border-b-0" style={{ borderColor: "var(--aurora-border-default)" }}>
          <span className="aurora-text-code" style={{ color: "var(--aurora-text-muted)" }}>{index + 1}</span>
          <span className="min-w-0">
            <span className="block truncate aurora-text-code" style={{ color: "var(--aurora-text-primary)" }}>
              {frame.file}{frame.line ? `:${frame.line}` : ""}{frame.column ? `:${frame.column}` : ""}
            </span>
            {frame.label ? <span className="block aurora-text-meta">{frame.label}</span> : null}
          </span>
        </div>
      ))}
    </div>
  </div>
)
StackTrace.displayName = "StackTrace"

const EnvironmentVariables = ({ ref, className, variables, style, ...props }: EnvironmentVariablesProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid gap-2 rounded-[8px] border p-3", className)} style={panelStyle(style)} {...props}>
      <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
        <KeyRound className="size-3.5" aria-hidden />
        Environment
      </div>
      <Separator />
      <div className="grid gap-1">
        {variables.map((item) => (
          <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,168px)_auto] items-center gap-3 rounded-[6px] px-2 py-1.5">
            <span className="truncate aurora-text-code" style={{ color: "var(--aurora-text-primary)" }}>{item.key}</span>
            <span className="truncate aurora-text-code" style={{ color: item.secret ? "var(--aurora-accent-pink)" : "var(--aurora-text-muted)", justifySelf: "end" }}>
              {previewValue(item.value, item.secret)}
            </span>
            <span className="flex items-center gap-2 justify-self-end">
              {item.required ? <Badge tone="warn">Required</Badge> : null}
              {item.secret ? <Badge tone="rose">Secret</Badge> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
EnvironmentVariables.displayName = "EnvironmentVariables"

const Checkpoint = ({ ref, label, description, className, style, ...props }: CheckpointProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-3 border p-3", className)} style={panelStyle(style)} {...props}>
      <Save className="mt-0.5 size-4" aria-hidden style={{ color: "var(--axon-orange)" }} />
      <div className="min-w-0">
        <div className="aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{label}</div>
        {description ? <div className="aurora-text-meta">{description}</div> : null}
      </div>
    </div>
  )
Checkpoint.displayName = "Checkpoint"

const Confirmation = ({ ref, title, description, confirmLabel = "Approve", cancelLabel = "Cancel", className, style, ...props }: ConfirmationProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid gap-3 border p-4", className)} style={panelStyle(style)} {...props}>
      <div className="flex items-center gap-2 aurora-text-section" style={{ color: "var(--aurora-text-primary)" }}>
        <CircleAlert className="size-4" aria-hidden style={{ color: "var(--aurora-warn)" }} />
        {title}
      </div>
      {description ? <p className="aurora-text-body" style={{ margin: 0 }}>{description}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="neutral" size="sm">
          <X className="size-3.5" data-icon="inline-start" aria-hidden />
          {cancelLabel}
        </Button>
        <Button type="button" variant="rose" size="sm">
          <Check className="size-3.5" data-icon="inline-start" aria-hidden />
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
Confirmation.displayName = "Confirmation"

const ContextPanel = ({ ref, used = 42100, limit = 128000, label = "Context", className, style, ...props }: ContextPanelProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const percent = limit > 0 ? Math.min(Math.max((used / limit) * 100, 0), 100) : 0

    return (
      <div
        ref={ref}
        className={cn("grid gap-2 border p-3", className)}
        style={{
          ...panelStyle(style),
          width: "min(520px, 100%)",
        }}
        {...props}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
            <Layers2 className="size-3.5 shrink-0" aria-hidden />
            <span>{label}</span>
          </div>
          <div className="shrink-0" style={{ color: "var(--aurora-text-muted)", fontSize: 10, lineHeight: "14px" }}>
            {formatTokenCount(used)} / {formatTokenCount(limit)}
          </div>
        </div>
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          aria-valuetext={`${formatTokenCount(used)} of ${formatTokenCount(limit)} tokens used`}
          style={{
            height: 18,
            borderRadius: 999,
            background: "var(--aurora-control-surface)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, var(--axon-orange), var(--aurora-accent-primary))",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              insetInlineStart: 6,
              top: "50%",
              transform: "translateY(-50%)",
              borderRadius: 999,
              background: "var(--aurora-overlay)",
              color: "var(--aurora-text-primary)",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              padding: "2px 5px",
            }}
          >
            {Math.round(percent)}%
          </span>
        </div>
      </div>
    )
  }
ContextPanel.displayName = "ContextPanel"

const Conversation = ({ ref, className, style, ...props }: ConversationProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      className={cn("grid gap-4 border p-4", className)}
      style={{
        ...panelStyle(style),
        background: [
          "radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--axon-orange) 10%, transparent), transparent 34%)",
          "linear-gradient(180deg, color-mix(in srgb, var(--aurora-panel-strong) 96%, transparent), var(--aurora-panel-medium))",
        ].join(", "),
        maxHeight: 520,
        overflowY: "auto",
      }}
      {...props}
    />
  )
Conversation.displayName = "Conversation"

const ModelSelector = ({ ref, models, value, defaultValue, onValueChange, label = "Model", name, disabled, required, triggerId, triggerLabel, className, style, ...props }: ModelSelectorProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={className} style={style} {...props}>
      <SelectorCard
        icon={<Sparkles className="size-3.5" aria-hidden style={{ color: "var(--axon-orange)" }} />}
        title={label}
        description="Select a model for this conversation."
        values={models}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        disabled={disabled}
        required={required}
        triggerId={triggerId}
        triggerLabel={triggerLabel ?? label}
      />
    </div>
  )
ModelSelector.displayName = "ModelSelector"

const Queue = ({ ref, tasks, ...props }: QueueProps & { ref?: React.Ref<HTMLDivElement> }) => <TaskList ref={ref} tasks={tasks} {...props} />
Queue.displayName = "Queue"

const Shimmer = ({ ref, className, style, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => (
    <div
      ref={ref}
      className={cn("h-3 overflow-hidden rounded-full", className)}
      style={{
        background: "linear-gradient(90deg, var(--aurora-control-surface), color-mix(in srgb, var(--axon-orange) 18%, transparent), var(--aurora-control-surface))",
        backgroundSize: "220% 100%",
        animation: "aurora-shimmer 1.4s linear infinite",
        ...style,
      }}
      {...props}
    />
  )
Shimmer.displayName = "Shimmer"

const Suggestion = ({ ref, className, style, options, children, onClick, disabled, ...props }: SuggestionProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid gap-2", className)} style={{ width: "100%", minWidth: 0, ...style }} {...props}>
      {(options ?? [{ id: "default", title: typeof children === "string" ? children : "Suggested next step" }]).map((option) => (
        <Button
          key={option.id}
          type="button"
          variant="neutral"
          disabled={disabled}
          onClick={onClick}
          className="h-auto min-w-0 justify-start whitespace-normal rounded-[10px] border px-3 py-3 text-left"
          style={{
            borderColor: "color-mix(in srgb, var(--axon-orange) 18%, var(--aurora-border-default))",
            background: "color-mix(in srgb, var(--axon-orange) 4%, var(--aurora-panel-medium))",
          }}
        >
          <span className="grid min-w-0 gap-1">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{option.title}</span>
              {option.badge ? <Badge shape="tag">{option.badge}</Badge> : null}
            </span>
            {option.description ? <span className="aurora-text-meta" style={{ minWidth: 0 }}>{option.description}</span> : null}
          </span>
        </Button>
      ))}
    </div>
  )
Suggestion.displayName = "Suggestion"

const Agent = ({ ref, name, role, status = "idle", className, style, ...props }: AgentProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border p-3", className)} style={panelStyle(style)} {...props}>
      <Bot className="size-[18px]" aria-hidden style={{ color: "var(--axon-orange)" }} />
      <span className="min-w-0">
        <span className="block truncate aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{name}</span>
        {role ? <span className="block aurora-text-meta">{role}</span> : null}
      </span>
      <Badge tone={status === "blocked" ? "warn" : status === "running" ? "success" : "neutral"} dot={status === "running"}>
        {formatStatusLabel(status)}
      </Badge>
    </div>
  )
Agent.displayName = "Agent"

const Commit = ({ ref, hash, message, author, className, style, ...props }: CommitProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-3 border p-3", className)} style={panelStyle(style)} {...props}>
      <GitCommitHorizontal className="size-4" aria-hidden style={{ color: "var(--aurora-accent-primary)" }} />
      <span className="min-w-0">
        <span className="block truncate aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{message}</span>
        <span className="block aurora-text-meta">{hash}{author ? ` by ${author}` : ""}</span>
      </span>
    </div>
  )
Commit.displayName = "Commit"

const JsxPreview = ({ ref, code, className, style, ...props }: JsxPreviewProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={className} style={style} {...props}>
      <CodeSurface icon={<FileCode className="size-3.5" aria-hidden />} title="JSX Preview" value={code}>
        <pre className="overflow-auto rounded-[7px] border p-3 aurora-text-code" style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-panel-strong)" }}>{code}</pre>
      </CodeSurface>
    </div>
  )
JsxPreview.displayName = "JsxPreview"

const PackageInfo = ({ ref, name, version, description, className, style, ...props }: PackageInfoProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[8px] border p-3", className)} style={panelStyle(style)} {...props}>
      <Package className="size-5" aria-hidden style={{ color: "var(--aurora-accent-primary)" }} />
      <span className="min-w-0">
        <span className="block truncate aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{name}</span>
        <span className="block aurora-text-meta" style={{ color: "var(--aurora-accent-strong)" }}>{version}</span>
        {description ? <span className="block aurora-text-meta">{description}</span> : null}
      </span>
    </div>
  )
PackageInfo.displayName = "PackageInfo"

const Sandbox = ({ ref, title = "Sandbox", command = "pnpm dev", status = "running", runtime = "Node 20", paths = ["/workdir/app", "/workdir/.next"], envCount = 8, className, style, children, ...props }: SandboxProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid gap-3 border p-3", className)} style={panelStyle(style)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}><Boxes className="size-3.5" aria-hidden />{title}</span>
        <Badge tone={status === "running" ? "success" : "neutral"} dot={status === "running"}>
          {formatStatusLabel(status)}
        </Badge>
      </div>
      <div className="grid gap-3 rounded-[8px] border p-3" style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-panel-strong)" }}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{command}</Badge>
          <Badge tone="neutral" shape="tag">{runtime}</Badge>
          <Badge tone="neutral" shape="tag">{envCount} Env Vars</Badge>
        </div>
        <div className="grid gap-2">
          {paths.map((path) => (
            <div key={path} className="flex items-center gap-2 rounded-[7px] border px-3 py-2" style={{ borderColor: "var(--aurora-border-default)" }}>
              <FileText className="size-3.5" aria-hidden style={{ color: "var(--aurora-text-muted)" }} />
              <span className="truncate aurora-text-meta" style={{ color: "var(--aurora-text-primary)" }}>{path}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="neutral" size="sm">Open Logs</Button>
          <Button type="button" variant="ghost" size="sm">Attach Shell</Button>
        </div>
      </div>
      {children}
    </div>
  )
Sandbox.displayName = "Sandbox"

const SchemaDisplay = ({ ref, schema, className, style, ...props }: SchemaDisplayProps & { ref?: React.Ref<HTMLPreElement> }) => (
    <div className={className} style={style}>
      <CodeSurface icon={<FileCode className="size-3.5" aria-hidden />} title="Schema Display" value={stringifyWithOrder(schema)}>
        <pre
          ref={ref}
          className="overflow-auto rounded-[7px] border p-3 aurora-text-code"
          style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-panel-strong)" }}
          {...props}
        >
          {renderJsonValue(schema)}
        </pre>
      </CodeSurface>
    </div>
  )
SchemaDisplay.displayName = "SchemaDisplay"

const Snippet = ({ ref, code, language = "tsx", className, style, ...props }: SnippetProps & { ref?: React.Ref<HTMLPreElement> }) => (
    <div className={className} style={style}>
      <CodeSurface icon={<FileCode className="size-3.5" aria-hidden />} title="Snippet" value={code}>
        <pre
          ref={ref}
          className="overflow-auto rounded-[7px] border p-3 aurora-text-code"
          style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-panel-strong)" }}
          {...props}
        >
          <span style={{ color: "var(--aurora-text-muted)" }}>{language}</span>
          {"\n"}
          {code}
        </pre>
      </CodeSurface>
    </div>
  )
Snippet.displayName = "Snippet"

const Image = ({ ref, caption, className, style, alt = "", ...props }: AuroraImageProps & { ref?: React.Ref<HTMLImageElement> }) => (
    <figure className={cn("grid gap-2", className)} style={{ margin: 0 }}>
      <img ref={ref} alt={alt} className="w-full rounded-[8px] border object-cover" style={{ borderColor: "var(--aurora-border-default)", ...style }} {...props} />
      {caption ? <figcaption className="aurora-text-meta">{caption}</figcaption> : null}
    </figure>
  )
Image.displayName = "Image"

const OpenInChat = ({ ref, children = "Open in Chat", ...props }: OpenInChatProps & { ref?: React.Ref<HTMLButtonElement> }) => (
    <Button ref={ref} type="button" variant="neutral" size="sm" {...props}>
      <Send className="size-3.5" data-icon="inline-start" aria-hidden />
      {children}
    </Button>
  )
OpenInChat.displayName = "OpenInChat"

const AudioPlayer = ({ ref, title = "Voice Response", duration = "00:42", className, style, ...props }: AudioPlayerProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border p-3", className)} style={panelStyle(style)} {...props}>
      <Button type="button" size="icon" variant="neutral" aria-label={`Play ${title}`}>
        <Play className="size-4" data-icon="inline-start" aria-hidden />
      </Button>
      <span className="min-w-0">
        <span className="block truncate aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{title}</span>
        <span className="block h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--aurora-accent-primary) 48%, var(--aurora-control-surface) 48%)" }} />
      </span>
      <span className="aurora-text-meta">{duration}</span>
    </div>
  )
AudioPlayer.displayName = "AudioPlayer"

const MicSelector = ({ ref, devices, value, defaultValue, onValueChange, name, disabled, required, triggerId, triggerLabel, ...props }: MicSelectorProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} {...props}>
      <SelectorCard
        icon={<Mic className="size-3.5" aria-hidden />}
        title="Microphone"
        description="Swap inputs without dropping back to a native control."
        values={devices}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        disabled={disabled}
        required={required}
        triggerId={triggerId}
        triggerLabel={triggerLabel ?? "Microphone"}
      />
    </div>
  )
MicSelector.displayName = "MicSelector"

const Persona = ({ ref, name, description, className, style, ...props }: PersonaProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-3 border p-3", className)} style={panelStyle(style)} {...props}>
      <UserRound className="size-5" aria-hidden style={{ color: "var(--aurora-accent-pink)" }} />
      <span className="min-w-0">
        <span className="block aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{name}</span>
        {description ? <span className="block aurora-text-meta">{description}</span> : null}
      </span>
    </div>
  )
Persona.displayName = "Persona"

const SpeechInput = ({ ref, className, style, ...props }: SpeechInputProps & { ref?: React.Ref<HTMLTextAreaElement> }) => (
    <div className="grid gap-2 border p-3" style={panelStyle()}>
      <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}><Mic className="size-3.5" aria-hidden />Speech Input</div>
      <Textarea ref={ref} className={cn("min-h-20 resize-none rounded-[8px] p-3 aurora-text-body", className)} style={{ ...style }} {...props} />
    </div>
  )
SpeechInput.displayName = "SpeechInput"

const Transcription = ({ ref, segments, className, style, ...props }: TranscriptionProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("grid gap-2 rounded-[8px] border p-3", className)} style={panelStyle(style)} {...props}>
      <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}>
        <Mic className="size-3.5" aria-hidden />
        Transcription
      </div>
      <div className="grid gap-2">
        {segments.map((segment) => (
          <div
            key={`${segment.speaker}-${segment.timecode}`}
            className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3 rounded-[7px] border px-3 py-2"
            style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-panel-strong)" }}
          >
            <span className="aurora-text-meta" style={{ color: "var(--aurora-accent-strong)" }}>{segment.timecode}</span>
            <span className="min-w-0">
              <span className="block aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}>{segment.speaker}</span>
              <span className="block aurora-text-body" style={{ marginTop: 4 }}>{segment.text}</span>
            </span>
            <Badge tone="neutral" shape="tag">{segment.confidence ? `${segment.confidence}%` : "Live"}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
Transcription.displayName = "Transcription"

const VoiceSelector = ({ ref, voices, value, defaultValue, onValueChange, name, disabled, required, triggerId, triggerLabel, ...props }: VoiceSelectorProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} {...props}>
      <SelectorCard
        icon={<Sparkles className="size-3.5" aria-hidden style={{ color: "var(--axon-orange)" }} />}
        title="Voice"
        description="Select a voice for audio output."
        values={voices}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        disabled={disabled}
        required={required}
        triggerId={triggerId}
        triggerLabel={triggerLabel ?? "Voice"}
      />
    </div>
  )
VoiceSelector.displayName = "VoiceSelector"

const Canvas = ({ ref, className, style, ...props }: CanvasProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("relative min-h-64 border p-4", className)} style={{ ...panelStyle(style), backgroundImage: "linear-gradient(var(--aurora-border-default) 1px, transparent 1px), linear-gradient(90deg, var(--aurora-border-default) 1px, transparent 1px)", backgroundSize: "24px 24px" }} {...props} />
  )
Canvas.displayName = "Canvas"

const Connection = ({ ref, from, to, className, style, ...props }: ConnectionProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("flex items-center gap-2 aurora-text-control", className)} style={{ color: "var(--aurora-text-primary)", ...style }} {...props}>
      <Network className="size-4" aria-hidden style={{ color: "var(--aurora-accent-primary)" }} />{from}<Route className="size-4" aria-hidden />{to}
    </div>
  )
Connection.displayName = "Connection"

const Controls = ({ ref, className, style, ...props }: ControlsProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("flex items-center gap-2 border p-2", className)} style={panelStyle(style)} {...props} />
  )
Controls.displayName = "Controls"

const Edge = ({ ref, label = "Edge", className, style, ...props }: EdgeProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("flex items-center gap-2 aurora-text-meta", className)} style={style} {...props}>
      <span className="h-px flex-1" style={{ background: "var(--aurora-accent-primary)" }} />
      {label}
      <span className="h-px flex-1" style={{ background: "var(--aurora-accent-primary)" }} />
    </div>
  )
Edge.displayName = "Edge"

const Node = ({ ref, title, description, className, style, ...props }: NodeProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <div ref={ref} className={cn("w-56 border p-3", className)} style={panelStyle(style)} {...props}>
      <div className="flex items-center gap-2 aurora-text-control" style={{ color: "var(--aurora-text-primary)" }}><Workflow className="size-4" aria-hidden style={{ color: "var(--aurora-accent-primary)" }} />{title}</div>
      {description ? <div className="aurora-text-meta">{description}</div> : null}
    </div>
  )
Node.displayName = "Node"

const Panel = ({ ref, title, className, children, style, ...props }: PanelProps & { ref?: React.Ref<HTMLDivElement> }) => (
    <aside ref={ref} className={cn("grid gap-3 border p-3", className)} style={panelStyle(style)} {...props}>
      {title ? <div className="flex items-center gap-2 aurora-text-label" style={{ color: "var(--aurora-text-muted)" }}><Sparkles className="size-3.5 shrink-0" aria-hidden style={{ color: "var(--axon-orange)" }} />{title}</div> : null}
      {children}
    </aside>
  )
Panel.displayName = "Panel"

export {
  Agent,
  AudioPlayer,
  Canvas,
  Checkpoint,
  Commit,
  Confirmation,
  Connection,
  ContextPanel,
  ContextPanel as Context,
  Controls,
  Conversation,
  Edge,
  EnvironmentVariables,
  Image,
  InlineCitation,
  JsxPreview,
  MicSelector,
  Message,
  MessageAvatar,
  MessageContent,
  ModelSelector,
  Node,
  OpenInChat,
  PackageInfo,
  Panel,
  Persona,
  Queue,
  Sandbox,
  SchemaDisplay,
  Shimmer,
  Snippet,
  Source,
  Sources,
  SpeechInput,
  StackTrace,
  Suggestion,
  TaskList,
  TestResults,
  Transcription,
  VoiceSelector,
}
