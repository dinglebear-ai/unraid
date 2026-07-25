"use client"

import * as React from "react"
import {
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { useClipboard } from "@/lib/aurora/use-clipboard"

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArtifactVariant = "panel" | "card" | "inline"

export interface ArtifactProps {
  title: string
  language: string
  code: string
  preview?: React.ReactNode
  variant?: ArtifactVariant
  isStreaming?: boolean
  className?: string
  style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ICON_STROKE = 1.65

function CopyIcon() {
  return <Copy size={14} strokeWidth={ICON_STROKE} aria-hidden />
}

function DownloadIcon() {
  return <Download size={14} strokeWidth={ICON_STROKE} aria-hidden />
}

function ExpandIcon() {
  return <Maximize2 size={14} strokeWidth={ICON_STROKE} aria-hidden />
}

function CollapseIcon() {
  return <Minimize2 size={14} strokeWidth={ICON_STROKE} aria-hidden />
}

function CodeIcon() {
  return <Code2 size={13} strokeWidth={ICON_STROKE} aria-hidden />
}

function EyeIcon() {
  return <Eye size={13} strokeWidth={ICON_STROKE} aria-hidden />
}

// ---------------------------------------------------------------------------
// Simple syntax highlighter (no-dep, Aurora token colors)
// ---------------------------------------------------------------------------

const LANG_COLORS: Record<string, string> = {
  typescript: "var(--aurora-code-type)",
  javascript: "var(--aurora-warn)",
  tsx: "var(--aurora-code-function)",
  jsx: "var(--aurora-code-function)",
  python: "var(--aurora-accent-deep)",
  rust: "var(--aurora-accent-pink-deep)",
  go: "var(--aurora-accent-primary)",
  bash: "var(--aurora-success)",
  sh: "var(--aurora-success)",
  json: "var(--aurora-accent-pink)",
  css: "var(--aurora-accent-deep)",
  html: "var(--aurora-error)",
  sql: "var(--aurora-warn)",
  yaml: "var(--aurora-error)",
  toml: "var(--aurora-accent-pink-deep)",
}

function LanguageBadge({ language }: { language: string }) {
  const color = LANG_COLORS[language.toLowerCase()] ?? "var(--aurora-accent-primary)"
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--aurora-font-mono)",
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
        borderRadius: 6,
        padding: "1px 7px",
        letterSpacing: "0.02em",
      }}
    >
      {language}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick?: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
      }}
    >
      {children}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Code display with optional streaming cursor
// ---------------------------------------------------------------------------

function CodeDisplay({
  code,
  isStreaming,
  maxHeight,
}: {
  code: string
  isStreaming?: boolean
  maxHeight?: string | number
}) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "14px 16px",
        overflowX: "auto",
        overflowY: maxHeight ? "auto" : "visible",
        maxHeight,
        fontSize: 13,
        lineHeight: 1.65,
        fontFamily: "var(--aurora-font-mono)",
        color: "var(--aurora-text-primary)",
        whiteSpace: "pre",
        background: "transparent",
      }}
    >
      <code>{code}</code>
      {isStreaming && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "var(--axon-orange, #ff9645)",
            marginLeft: 1,
            verticalAlign: "text-bottom",
            borderRadius: 1,
            animation: "aurora-blink-cursor 1s step-end infinite",
          }}
        />
      )}
    </pre>
  )
}

// ---------------------------------------------------------------------------
// Tab pill
// ---------------------------------------------------------------------------

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? "neutral" : "ghost"}
      size="sm"
      onClick={onClick}
      style={{
        gap: 5,
        fontSize: 12,
      }}
    >
      {children}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Copy helper
// ---------------------------------------------------------------------------

function useCopy(text: string) {
  const clipboard = useClipboard(1600)
  const copy = React.useCallback(() => void clipboard.copy(text), [clipboard, text])
  return { copied: clipboard.copied, error: clipboard.error, copy }
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

function downloadText(filename: string, text: string) {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ---------------------------------------------------------------------------
// Panel variant (full-featured)
// ---------------------------------------------------------------------------

function ArtifactPanel({
  title,
  language,
  code,
  preview,
  isStreaming,
  style,
}: ArtifactProps) {
  const [tab, setTab] = React.useState<"code" | "preview">("code")
  const [expanded, setExpanded] = React.useState(false)
  const { copied, copy } = useCopy(code)

  const hasPreview = !!preview

  return (
    <div
      style={{
        background: "var(--aurora-panel-medium)",
        border: "1px solid var(--aurora-border-default)",
        borderRadius: "var(--aurora-radius-2)",
        overflow: "hidden",
        boxShadow: [
          "var(--aurora-shadow-medium)",
          "var(--aurora-highlight-medium)",
        ].join(", "),
        ...style,
      }}
    >
      {/* Titlebar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 12px",
          borderBottom: "1px solid var(--aurora-border-default)",
          background: "var(--aurora-panel-strong)",
        }}
      >
        {/* Title + badge */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--aurora-text-primary)",
            fontFamily: "var(--aurora-font-sans)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        <LanguageBadge language={language} />

        {/* Streaming indicator */}
        {isStreaming && (
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              border: "1.5px solid var(--axon-orange, #ff9645)",
              borderTopColor: "transparent",
              animation: "aurora-spin 0.7s linear infinite",
            }}
          />
        )}
      </div>

      {/* Tab bar (only if preview exists) */}
      {hasPreview && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            borderBottom: "1px solid var(--aurora-border-default)",
            background: "var(--aurora-panel-strong)",
          }}
        >
          <TabPill active={tab === "code"} onClick={() => setTab("code")}>
            <CodeIcon />
            Code
          </TabPill>
          <TabPill active={tab === "preview"} onClick={() => setTab("preview")}>
            <EyeIcon />
            Preview
          </TabPill>

          {/* Toolbar on right */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            <ToolbarBtn onClick={copy} title={copied ? "Copied" : "Copy code"}>
              {copied ? (
                <Check size={14} strokeWidth={1.75} aria-hidden style={{ color: "var(--aurora-success)" }} />
              ) : (
                <CopyIcon />
              )}
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => downloadText(`${title}.${language}`, code)}
              title="Download"
            >
              <DownloadIcon />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => setExpanded((e) => !e)}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </ToolbarBtn>
          </div>
        </div>
      )}

      {/* Toolbar without tabs */}
      {!hasPreview && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2,
            padding: "4px 8px",
            borderBottom: "1px solid var(--aurora-border-default)",
            background: "var(--aurora-panel-strong)",
          }}
        >
          <ToolbarBtn onClick={copy} title={copied ? "Copied" : "Copy code"}>
            {copied ? (
              <Check size={14} strokeWidth={1.75} aria-hidden style={{ color: "var(--aurora-success)" }} />
            ) : (
              <CopyIcon />
            )}
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => downloadText(`${title}.${language}`, code)}
            title="Download"
          >
            <DownloadIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </ToolbarBtn>
        </div>
      )}

      {/* Body */}
      <div style={{ background: "var(--aurora-bg)" }}>
        {tab === "code" || !hasPreview ? (
          <CodeDisplay
            code={code}
            isStreaming={isStreaming}
            maxHeight={expanded ? undefined : 380}
          />
        ) : (
          <div
            style={{
              padding: 16,
              minHeight: 120,
              maxHeight: expanded ? undefined : 400,
              overflowY: "auto",
            }}
          >
            {preview}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card variant (compact in-chat mini card)
// ---------------------------------------------------------------------------

function ArtifactCard({ title, language, code, isStreaming, style }: ArtifactProps) {
  const [open, setOpen] = React.useState(false)
  const { copied, copy } = useCopy(code)
  const preview = code.split("\n").slice(0, 3).join("\n")

  return (
    <div
      style={{
        background: "var(--aurora-panel-medium)",
        border: "1px solid var(--aurora-border-default)",
        borderRadius: "var(--aurora-radius-1)",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header row */}
      <Button variant="plain" size="unstyled"
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <CodeIcon />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--aurora-text-primary)",
            fontFamily: "var(--aurora-font-sans)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        <LanguageBadge language={language} />
        {isStreaming && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              border: "1.5px solid var(--axon-orange, #ff9645)",
              borderTopColor: "transparent",
              animation: "aurora-spin 0.7s linear infinite",
            }}
          />
        )}
        <ChevronDown
          size={12}
          strokeWidth={ICON_STROKE}
          aria-hidden
          style={{
            color: "var(--aurora-text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            flexShrink: 0,
          }}
        />
      </Button>

      {/* Collapsed preview */}
      {!open && (
        <div
          style={{
            padding: "0 12px 10px",
            fontSize: 11,
            fontFamily: "var(--aurora-font-mono)",
            color: "var(--aurora-text-muted)",
            whiteSpace: "pre",
            overflow: "hidden",
            borderTop: "1px solid var(--aurora-border-default)",
          }}
        >
          <pre style={{ margin: "8px 0 0", padding: 0, background: "transparent" }}>
            {preview}
            {code.split("\n").length > 3 && (
              <span style={{ color: "var(--aurora-text-muted)", opacity: 0.6 }}>
                {"\n"}…
              </span>
            )}
          </pre>
        </div>
      )}

      {/* Expanded full code */}
      {open && (
        <div style={{ borderTop: "1px solid var(--aurora-border-default)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              padding: "4px 8px",
              background: "var(--aurora-panel-strong)",
            }}
          >
            <ToolbarBtn onClick={copy} title={copied ? "Copied" : "Copy"}>
              {copied ? (
                <Check size={14} strokeWidth={1.75} aria-hidden style={{ color: "var(--aurora-success)" }} />
              ) : (
                <CopyIcon />
              )}
            </ToolbarBtn>
          </div>
          <div style={{ background: "var(--aurora-bg)" }}>
            <CodeDisplay code={code} isStreaming={isStreaming} maxHeight={320} />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline variant (bare code block, single line toolbar)
// ---------------------------------------------------------------------------

function ArtifactInline({ title, language, code, isStreaming, style }: ArtifactProps) {
  const { copied, copy } = useCopy(code)

  return (
    <div
      style={{
        background: "var(--aurora-bg)",
        border: "1px solid var(--aurora-border-default)",
        borderRadius: "var(--aurora-radius-1)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 10px",
          background: "var(--aurora-panel-strong)",
          borderBottom: "1px solid var(--aurora-border-default)",
        }}
      >
        <LanguageBadge language={language} />
        <span
          style={{
            fontSize: 12,
            color: "var(--aurora-text-muted)",
            fontFamily: "var(--aurora-font-sans)",
            flex: 1,
          }}
        >
          {title}
        </span>
        <ToolbarBtn onClick={copy} title={copied ? "Copied" : "Copy"}>
          {copied ? (
            <Check size={14} strokeWidth={1.75} aria-hidden style={{ color: "var(--aurora-success)" }} />
          ) : (
            <CopyIcon />
          )}
        </ToolbarBtn>
      </div>
      <CodeDisplay code={code} isStreaming={isStreaming} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main exported Artifact component
// ---------------------------------------------------------------------------

export function Artifact({
  variant = "panel",
  ...props
}: ArtifactProps) {

  return (
    <>
      {variant === "card" && <ArtifactCard {...props} variant={variant} />}
      {variant === "inline" && <ArtifactInline {...props} variant={variant} />}
      {variant === "panel" && <ArtifactPanel {...props} variant={variant} />}
    </>
  )
}

export default Artifact
