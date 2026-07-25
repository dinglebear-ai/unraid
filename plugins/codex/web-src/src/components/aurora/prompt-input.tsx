"use client"

import * as React from "react"
import {
  AtSign,
  ChevronDown,
  Command,
  FileText,
  Folder,
  Paperclip,
  Send,
  Sparkles,
  Square,
  UserRound,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { Textarea } from "@/components/ui/aurora/textarea"

export interface Attachment {
  id: string
  name: string
  type: "image" | "file"
  /** Data URL or object URL for images */
  url?: string
}

export interface SlashCommand {
  id: string
  label: string
  description?: string
}

export interface MentionItem {
  id: string
  label: string
  kind: "file" | "agent" | "folder"
}

export interface PromptInputModel {
  id: string
  label: string
}

export interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string, attachments: Attachment[]) => void
  onAddAttachment?: (attachment: Attachment) => void
  onStop?: () => void
  attachments?: Attachment[]
  onRemoveAttachment?: (id: string) => void
  model?: string
  models?: PromptInputModel[]
  onModelChange?: (model: string) => void
  /** Product-specific controls rendered at the start of the bottom toolbar. */
  toolbarStart?: React.ReactNode
  isStreaming?: boolean
  placeholder?: string
  slashCommands?: SlashCommand[]
  mentionItems?: MentionItem[]
  /** Keep typed slash-command completion while hiding its duplicate toolbar trigger. */
  showSlashButton?: boolean
  /** Keep typed mention completion while hiding its duplicate toolbar trigger. */
  showMentionButton?: boolean
}

const DEFAULT_MODELS: PromptInputModel[] = [
  { id: "claude-opus-4-5", label: "Claude Opus 4.5" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
]

const DEFAULT_SLASH_COMMANDS: SlashCommand[] = [
  { id: "clear", label: "/clear", description: "Clear conversation" },
  { id: "search", label: "/search", description: "Search the web" },
  { id: "code", label: "/code", description: "Enter code mode" },
  { id: "plan", label: "/plan", description: "Generate a plan" },
  { id: "summarize", label: "/summarize", description: "Summarize context" },
]

const DEFAULT_MENTIONS: MentionItem[] = [
  { id: "src", label: "src/", kind: "folder" },
  { id: "readme", label: "README.md", kind: "file" },
  { id: "agent-coder", label: "Coder Agent", kind: "agent" },
  { id: "agent-reviewer", label: "Reviewer Agent", kind: "agent" },
]

// ---------------------------------------------------------------------------
// Static style objects — hoisted to module scope so they are never reallocated
// ---------------------------------------------------------------------------

const S = {
  root: { position: "relative", width: "100%", minWidth: 0 } as React.CSSProperties,

  popup: {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    left: 0,
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-strong)",
    borderRadius: "var(--aurora-radius-2)",
    boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)",
    zIndex: "var(--z-popover)",
    overflow: "hidden",
    maxWidth: "min(100%, calc(100vw - 32px))",
    maxHeight: "min(320px, 45vh)",
    overflowY: "auto",
  } as React.CSSProperties,

  popupHeader: {
    padding: "6px 10px 4px",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--aurora-text-muted)",
    borderBottom: "1px solid var(--aurora-border-default)",
  } as React.CSSProperties,

  slashPopup: { width: "min(280px, 100%)" } as React.CSSProperties,
  mentionPopup: { width: "min(260px, 100%)" } as React.CSSProperties,

  slashRowBase: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "7px 12px",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
  } as React.CSSProperties,

  slashLabel: {
    fontFamily: "var(--aurora-font-mono)",
    fontSize: "13px",
    color: "var(--axon-orange)",
    minWidth: "90px",
    flexShrink: 0,
  } as React.CSSProperties,

  slashDescription: {
    fontSize: "12px",
    color: "var(--aurora-text-muted)",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  mentionRowBase: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "7px 12px",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
    color: "var(--aurora-text-primary)",
  } as React.CSSProperties,

  mentionIcon: { color: "var(--aurora-text-muted)", flexShrink: 0 } as React.CSSProperties,
  mentionLabel: {
    fontSize: "13px",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  mentionKindLabel: {
    marginLeft: "auto",
    fontSize: "10px",
    color: "var(--aurora-text-muted)",
    textTransform: "capitalize" as const,
  } as React.CSSProperties,

  modelPopup: {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    right: 0,
    width: "min(220px, 100%)",
    maxWidth: "min(100%, calc(100vw - 32px))",
    maxHeight: "min(280px, 42vh)",
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-strong)",
    borderRadius: "var(--aurora-radius-2)",
    boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)",
    zIndex: "var(--z-popover)",
    overflow: "hidden",
    overflowY: "auto",
    padding: "4px",
  } as React.CSSProperties,

  containerTransition: {
    transition: "border-color 0.15s ease-out, box-shadow 0.15s ease-out",
    overflow: "hidden",
  } as React.CSSProperties,

  mentionChipsRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "5px",
    padding: "8px 12px 0",
  } as React.CSSProperties,

  mentionChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px 2px 6px",
    background: "color-mix(in srgb, var(--axon-orange) 12%, var(--aurora-panel-medium))",
    border: "1px solid color-mix(in srgb, var(--axon-orange) 32%, transparent)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--axon-orange)",
    fontWeight: 500,
  } as React.CSSProperties,

  mentionChipRemove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 0 0 2px",
    color: "var(--aurora-text-muted)",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  attachChipsRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
    padding: "8px 12px 0",
  } as React.CSSProperties,

  attachChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "var(--aurora-control-surface)",
    border: "1px solid var(--aurora-border-default)",
    borderRadius: "10px",
    fontSize: "12px",
    color: "var(--aurora-text-primary)",
    maxWidth: "180px",
  } as React.CSSProperties,

  attachImg: {
    width: "22px",
    height: "22px",
    borderRadius: "6px",
    objectFit: "cover" as const,
    flexShrink: 0,
  } as React.CSSProperties,

  attachFileIcon: { color: "var(--aurora-text-muted)", flexShrink: 0 } as React.CSSProperties,

  attachName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    minWidth: 0,
    maxWidth: "140px",
  } as React.CSSProperties,

  attachRemove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--aurora-text-muted)",
    padding: "0",
    lineHeight: 1,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  textarea: {
    display: "block",
    width: "100%",
    resize: "none" as const,
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "12px 14px 4px",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "var(--aurora-text-primary)",
    fontFamily: "inherit",
    minHeight: "44px",
    maxHeight: "200px",
    overflowY: "auto" as const,
    caretColor: "var(--aurora-accent-primary)",
  } as React.CSSProperties,

  toolbar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "6px",
    padding: "8px 10px 10px",
    borderTop: "1px solid color-mix(in srgb, var(--aurora-border-default) 72%, transparent)",
    background: "color-mix(in srgb, var(--aurora-control-surface) 45%, transparent)",
  } as React.CSSProperties,

  fileInput: { display: "none" } as React.CSSProperties,
  spacer: { flex: "1 1 auto", minWidth: "12px" } as React.CSSProperties,
  iconBtnShrink: { flexShrink: 0 } as React.CSSProperties,

  modelBtn: {
    gap: "5px",
    fontSize: "11px",
    marginLeft: "2px",
    minWidth: 0,
    flex: "1 1 168px",
    maxWidth: "min(100%, 190px)",
    color: "var(--axon-orange)",
    borderColor: "color-mix(in srgb, var(--axon-orange) 32%, transparent)",
    background: "color-mix(in srgb, var(--axon-orange) 12%, var(--aurora-panel-medium))",
  } as React.CSSProperties,

  modelLabel: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  streamingStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    minHeight: 28,
    padding: "0 9px",
    borderRadius: "999px",
    border: "1px solid var(--axon-orange-border)",
    background: "var(--axon-orange-surface)",
    color: "var(--axon-orange-strong)",
    fontFamily: "var(--aurora-font-sans)",
    fontSize: "11px",
    fontWeight: 650,
    letterSpacing: "0.012em",
    lineHeight: 1,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  streamingDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--axon-orange)",
    boxShadow: "0 0 7px color-mix(in srgb, var(--axon-orange) 70%, transparent)",
    flexShrink: 0,
  } as React.CSSProperties,

  toolbarBtn: {
    width: 28,
    height: 28,
    flexShrink: 0,
    color: "var(--aurora-text-muted)",
  } as React.CSSProperties,
} as const

// ---------------------------------------------------------------------------
// Derived style helpers (vary by active state — built once per active index)
// ---------------------------------------------------------------------------

function slashRowStyle(active: boolean): React.CSSProperties {
  return {
    ...S.slashRowBase,
    background: active ? "var(--aurora-hover-bg)" : "transparent",
    borderLeft: active ? "2px solid var(--axon-orange)" : "2px solid transparent",
    boxShadow: active
      ? "inset 0 0 0 1px color-mix(in srgb, var(--axon-orange) 16%, transparent)"
      : "none",
  }
}

function mentionRowStyle(active: boolean): React.CSSProperties {
  return {
    ...S.mentionRowBase,
    background: active ? "var(--aurora-hover-bg)" : "transparent",
    borderLeft: active ? "2px solid var(--axon-orange)" : "2px solid transparent",
    boxShadow: active
      ? "inset 0 0 0 1px color-mix(in srgb, var(--axon-orange) 16%, transparent)"
      : "none",
  }
}

function modelRowStyle(active: boolean): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "7px 10px",
    background: active ? "var(--aurora-hover-bg)" : "transparent",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "13px",
    color: active ? "var(--axon-orange)" : "var(--aurora-text-primary)",
    fontWeight: active ? 600 : 400,
    boxShadow: active
      ? "inset 0 0 0 1px color-mix(in srgb, var(--axon-orange) 18%, transparent)"
      : "none",
  }
}

function attachChipStyle(isImage: boolean): React.CSSProperties {
  return { ...S.attachChip, padding: isImage ? "2px 8px 2px 2px" : "3px 8px" }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function insertTrigger(current: string, char: string, setter: (v: string) => void) {
  const sep = current.length > 0 && !current.endsWith(" ") ? " " : ""
  setter(current + sep + char)
}

function FileIcon({ kind }: { kind: "file" | "agent" | "folder" }) {
  const iconProps = { size: 13, strokeWidth: 1.6, "aria-hidden": true } as const
  if (kind === "folder") return <Folder {...iconProps} />
  if (kind === "agent") return <UserRound {...iconProps} />
  return <FileText {...iconProps} />
}

function getMentionKindLabel(item: MentionItem) {
  const label = item.label.toLowerCase()
  const kind = item.kind.toLowerCase()
  return label.includes(kind) ? null : item.kind
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PromptInput({
  value,
  onChange,
  onSubmit,
  onStop,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  model = "claude-sonnet-4-6",
  models = DEFAULT_MODELS,
  onModelChange,
  toolbarStart,
  isStreaming = false,
  placeholder = "Ask anything…",
  slashCommands = DEFAULT_SLASH_COMMANDS,
  mentionItems = DEFAULT_MENTIONS,
  showSlashButton = true,
  showMentionButton = true,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const objectUrlsRef = React.useRef<string[]>([])
  const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevAttachmentsRef = React.useRef<Attachment[]>(attachments)
  const reactId = React.useId()
  const slashListboxId = `${reactId}-slash-commands`
  const mentionListboxId = `${reactId}-mentions`
  const modelButtonId = `${reactId}-model-trigger`
  const modelListboxId = `${reactId}-models`

  const [isFocused, setIsFocused] = React.useState(false)
  const [showModelMenu, setShowModelMenu] = React.useState(false)

  const [slashOpen, setSlashOpen] = React.useState(false)
  const [slashQuery, setSlashQuery] = React.useState("")
  const [slashIndex, setSlashIndex] = React.useState(0)

  const [mentionOpen, setMentionOpen] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState("")
  const [mentionIndex, setMentionIndex] = React.useState(0)
  const [selectedMentions, setSelectedMentions] = React.useState<MentionItem[]>([])

  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }, [value])

  // Revoke object URLs when parent removes attachments to prevent silent memory leaks
  React.useEffect(() => {
    const prev = prevAttachmentsRef.current
    const currentIds = new Set(attachments.map((c) => c.id))
    const removed = prev.filter((p) => !currentIds.has(p.id))
    removed.forEach((att) => {
      if (att.url) {
        URL.revokeObjectURL(att.url)
        objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== att.url)
      }
    })
    prevAttachmentsRef.current = attachments
  }, [attachments])

  const filteredSlash = React.useMemo(
    () => slashCommands.filter((c) => c.label.toLowerCase().includes(slashQuery.toLowerCase())),
    [slashCommands, slashQuery]
  )

  const filteredMentions = React.useMemo(
    () =>
      mentionItems.filter(
        (m) =>
          m.label.toLowerCase().includes(mentionQuery.toLowerCase()) &&
          !selectedMentions.find((s) => s.id === m.id)
      ),
    [mentionItems, mentionQuery, selectedMentions]
  )
  const slashActiveIndex = Math.min(slashIndex, Math.max(filteredSlash.length - 1, 0))
  const mentionActiveIndex = Math.min(mentionIndex, Math.max(filteredMentions.length - 1, 0))
  const activeSlashId = slashOpen && filteredSlash[slashActiveIndex] ? `${reactId}-slash-${filteredSlash[slashActiveIndex].id}` : undefined
  const activeMentionId =
    mentionOpen && filteredMentions[mentionActiveIndex] ? `${reactId}-mention-${filteredMentions[mentionActiveIndex].id}` : undefined
  const activePopupId = slashOpen ? slashListboxId : mentionOpen ? mentionListboxId : undefined
  const activeDescendantId = activeSlashId ?? activeMentionId
  const modelLabel = models.find((m) => m.id === model)?.label ?? model

  // Memoized container styles — only change when isFocused toggles
  const containerStyle = React.useMemo<React.CSSProperties>(
    () => ({
      background: "var(--aurora-surface-raised)",
      border: `1px solid ${
        isFocused
          ? "color-mix(in srgb, var(--aurora-accent-primary) 48%, var(--aurora-border-strong))"
          : "var(--aurora-border-strong)"
      }`,
      borderRadius: "var(--aurora-radius-2)",
      boxShadow: isFocused
        ? [
            "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 55%, transparent)",
            "0 0 0 3px color-mix(in srgb, var(--aurora-accent-primary) 18%, transparent)",
            "0 16px 36px color-mix(in srgb, var(--aurora-accent-primary) 9%, transparent)",
            "var(--aurora-highlight-strong)",
          ].join(", ")
        : "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
      ...S.containerTransition,
    }),
    [isFocused]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSlashIndex((i) => (i + 1) % Math.max(filteredSlash.length, 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSlashIndex((i) => (i - 1 + filteredSlash.length) % Math.max(filteredSlash.length, 1))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const cmd = filteredSlash[slashActiveIndex]
        if (cmd) insertSlashCommand(cmd)
        return
      }
      if (e.key === "Escape") { setSlashOpen(false); return }
    }

    if (mentionOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((i) => (i + 1) % Math.max(filteredMentions.length, 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((i) => (i - 1 + filteredMentions.length) % Math.max(filteredMentions.length, 1))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const item = filteredMentions[mentionActiveIndex]
        if (item) insertMention(item)
        return
      }
      if (e.key === "Escape") { setMentionOpen(false); return }
    }

    if (e.key === "Enter" && !e.shiftKey && !isStreaming) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value
    onChange(v)

    const slashMatch = v.match(/(?:^|\s)\/(\w*)$/)
    if (slashMatch) {
      setSlashQuery(slashMatch[1])
      setSlashIndex(0)
      setSlashOpen(true)
      setMentionOpen(false)
    } else {
      setSlashOpen(false)
    }

    const mentionMatch = v.match(/@(\w*)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionIndex(0)
      setMentionOpen(true)
      setSlashOpen(false)
    } else {
      setMentionOpen(false)
    }
  }

  function insertSlashCommand(cmd: SlashCommand) {
    const newVal = value.replace(/(?:^|\s)\/\w*$/, (m) => m.replace(/\/\w*$/, cmd.label))
    onChange(newVal)
    setSlashOpen(false)
    textareaRef.current?.focus()
  }

  function insertMention(item: MentionItem) {
    setSelectedMentions((prev) => [...prev, item])
    const newVal = value.replace(/@\w*$/, "")
    onChange(newVal)
    setMentionOpen(false)
    textareaRef.current?.focus()
  }

  function removeMention(id: string) {
    setSelectedMentions((prev) => prev.filter((m) => m.id !== id))
  }

  function handleSubmit() {
    if (!value.trim() && attachments.length === 0) return
    onSubmit(value, attachments)
    setSelectedMentions([])
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((f) => {
      const isImage = f.type.startsWith("image/")
      let url: string | undefined
      if (isImage) {
        try {
          url = URL.createObjectURL(f)
          objectUrlsRef.current.push(url)
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[Aurora PromptInput] Failed to create object URL for image:", f.name, err)
          }
          return
        }
      }
      const att: Attachment = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`,
        name: f.name,
        type: isImage ? "image" : "file",
        url,
      }
      onAddAttachment?.(att)
    })
    e.target.value = ""
  }

  React.useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  function clearBlurTimer() {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
  }

  return (
    <div style={S.root}>
      {/* Slash commands popup */}
      {slashOpen && filteredSlash.length > 0 && (
        <div id={slashListboxId} role="listbox" aria-label="Slash commands" style={{ ...S.popup, ...S.slashPopup }}>
          <div style={S.popupHeader}>Commands</div>
          {filteredSlash.map((cmd, i) => (
            <Button
              variant="plain"
              size="unstyled"
              key={cmd.id}
              id={`${reactId}-slash-${cmd.id}`}
              role="option"
              aria-selected={i === slashActiveIndex}
              onClick={() => insertSlashCommand(cmd)}
              onMouseEnter={() => setSlashIndex(i)}
              style={slashRowStyle(i === slashActiveIndex)}
            >
              <span style={S.slashLabel}>{cmd.label}</span>
              {cmd.description && <span style={S.slashDescription}>{cmd.description}</span>}
            </Button>
          ))}
        </div>
      )}

      {/* Mention popup */}
      {mentionOpen && filteredMentions.length > 0 && (
        <div id={mentionListboxId} role="listbox" aria-label="Mentions" style={{ ...S.popup, ...S.mentionPopup }}>
          <div style={S.popupHeader}>Mention</div>
          {filteredMentions.map((item, i) => {
            const kindLabel = getMentionKindLabel(item)
            return (
              <Button
                variant="plain"
                size="unstyled"
                key={item.id}
                id={`${reactId}-mention-${item.id}`}
                role="option"
                aria-selected={i === mentionActiveIndex}
                onClick={() => insertMention(item)}
                onMouseEnter={() => setMentionIndex(i)}
                style={mentionRowStyle(i === mentionActiveIndex)}
              >
                <span style={S.mentionIcon}><FileIcon kind={item.kind} /></span>
                <span style={S.mentionLabel}>{item.label}</span>
                {kindLabel && <span style={S.mentionKindLabel}>{kindLabel}</span>}
              </Button>
            )
          })}
        </div>
      )}

      {/* Model selector dropdown */}
      {showModelMenu && (
        <div id={modelListboxId} role="listbox" aria-labelledby={modelButtonId} style={S.modelPopup}>
          {models.map((m) => (
            <Button
              variant="plain"
              size="unstyled"
              key={m.id}
              id={`${reactId}-model-${m.id}`}
              role="option"
              aria-selected={m.id === model}
              onClick={() => { onModelChange?.(m.id); setShowModelMenu(false) }}
              style={modelRowStyle(m.id === model)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      )}

      {/* Main container */}
      <div style={containerStyle} aria-busy={isStreaming}>
        {/* Mention chips row */}
        {selectedMentions.length > 0 && (
          <div style={S.mentionChipsRow}>
            {selectedMentions.map((m) => (
              <span key={m.id} style={S.mentionChip}>
                <FileIcon kind={m.kind} />
                {m.label}
                <Button
                  variant="plain"
                  size="unstyled"
                  onClick={() => removeMention(m.id)}
                  aria-label={`Remove ${m.label}`}
                  style={S.mentionChipRemove}
                >
                  <X size={12} strokeWidth={1.8} aria-hidden />
                </Button>
              </span>
            ))}
          </div>
        )}

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div style={S.attachChipsRow}>
            {attachments.map((att) => (
              <div key={att.id} style={attachChipStyle(att.type === "image")} title={att.name}>
                {att.type === "image" && att.url ? (
                  <img src={att.url} alt={att.name} style={S.attachImg} />
                ) : (
                  <span style={S.attachFileIcon}><FileIcon kind="file" /></span>
                )}
                <span style={S.attachName}>{att.name}</span>
                {onRemoveAttachment && (
                  <Button
                    variant="plain"
                    size="unstyled"
                    onClick={() => {
                      if (att.url) {
                        URL.revokeObjectURL(att.url)
                        objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== att.url)
                      }
                      onRemoveAttachment(att.id)
                    }}
                    aria-label={`Remove ${att.name}`}
                    style={S.attachRemove}
                  >
                    <X size={12} strokeWidth={1.8} aria-hidden />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { clearBlurTimer(); setIsFocused(true) }}
          onBlur={() => {
            setIsFocused(false)
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
            blurTimerRef.current = setTimeout(() => {
              setSlashOpen(false)
              setMentionOpen(false)
              setShowModelMenu(false)
            }, 150)
          }}
          disabled={isStreaming}
          placeholder={isStreaming ? "Generating…" : placeholder}
          autoResize
          rows={1}
          role="combobox"
          aria-expanded={slashOpen || mentionOpen}
          aria-controls={activePopupId}
          aria-activedescendant={activeDescendantId}
          aria-autocomplete="list"
          aria-label="Prompt input"
          className="border-none focus-visible:outline-none"
          style={S.textarea}
        />

        {/* Bottom toolbar */}
        <div style={S.toolbar}>
          {toolbarStart}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            disabled={isStreaming || !onAddAttachment}
            style={S.fileInput}
            onChange={handleFileSelect}
          />
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            aria-label={onAddAttachment ? "Attach File" : "Attachments unavailable"}
            title={onAddAttachment ? "Attach File" : "Attachments unavailable"}
            disabled={isStreaming || !onAddAttachment}
          >
            <Paperclip size={15} strokeWidth={1.65} aria-hidden />
          </ToolbarButton>

          {showSlashButton ? (
            <ToolbarButton
              onClick={() => {
                clearBlurTimer()
                insertTrigger(value, "/", onChange)
                setSlashQuery("")
                setSlashIndex(0)
                setSlashOpen(true)
                setMentionOpen(false)
                setShowModelMenu(false)
                textareaRef.current?.focus()
              }}
              aria-label="Slash commands"
              title="Commands"
              disabled={isStreaming}
            >
              <Command size={15} strokeWidth={1.65} aria-hidden />
            </ToolbarButton>
          ) : null}

          {showMentionButton ? (
            <ToolbarButton
              onClick={() => {
                clearBlurTimer()
                insertTrigger(value, "@", onChange)
                setMentionQuery("")
                setMentionIndex(0)
                setMentionOpen(true)
                setSlashOpen(false)
                setShowModelMenu(false)
                textareaRef.current?.focus()
              }}
              aria-label="Mention File or Agent"
              title="Mention File or Agent"
              disabled={isStreaming}
            >
              <AtSign size={15} strokeWidth={1.65} aria-hidden />
            </ToolbarButton>
          ) : null}

          <Button
            type="button"
            id={modelButtonId}
            variant="neutral"
            size="sm"
            onClick={() => { clearBlurTimer(); setShowModelMenu((o) => !o); setSlashOpen(false); setMentionOpen(false) }}
            aria-haspopup="listbox"
            aria-expanded={showModelMenu}
            aria-controls={modelListboxId}
            disabled={isStreaming}
            style={S.modelBtn}
          >
            <Sparkles size={13} strokeWidth={1.6} aria-hidden />
            <span style={S.modelLabel}>{modelLabel}</span>
            <ChevronDown size={12} strokeWidth={1.65} aria-hidden />
          </Button>

          {isStreaming && (
            <div role="status" aria-live="polite" style={S.streamingStatus}>
              <span aria-hidden="true" style={S.streamingDot} />
              Generating
            </div>
          )}

          <div style={S.spacer} />

          {isStreaming && (
            <Button type="button" variant="destructive" size="icon" onClick={onStop} aria-label="Stop generation" style={S.iconBtnShrink}>
              <Square size={12} strokeWidth={1.6} fill="currentColor" aria-hidden />
            </Button>
          )}

          {!isStreaming && (
            <Button
              type="button"
              variant="rose"
              size="icon"
              onClick={handleSubmit}
              disabled={!value.trim() && attachments.length === 0}
              aria-label="Send message"
              style={S.iconBtnShrink}
            >
              <Send size={15} strokeWidth={1.7} aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button {...props} type="button" variant="ghost" size="icon" style={{ ...S.toolbarBtn, ...style }}>
      {children}
    </Button>
  )
}

export default PromptInput
