"use client"

import * as React from "react"
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  TriangleAlert,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/aurora/button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PermissionVariant = "modal" | "banner" | "inline"

export interface PermissionPromptProps {
  /** Name of the tool or permission being requested */
  tool: string
  /** Human-readable description of the action */
  action: string
  /** File path, command, or resource target */
  target?: string
  variant?: PermissionVariant
  /** Marks this as a destructive/dangerous operation */
  isDangerous?: boolean
  onAllow?: () => void
  onDeny?: () => void
  onAllowAlways?: () => void
  allowLabel?: string
  denyLabel?: string
  /** Control visibility externally */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ICON_STROKE = 1.65

function ShieldIcon({ danger }: { danger?: boolean }) {
  const Icon = danger ? ShieldAlert : ShieldCheck
  return (
    <Icon
      size={18}
      strokeWidth={ICON_STROKE}
      aria-hidden
      style={{ color: danger ? "var(--aurora-error)" : "var(--aurora-accent-primary)" }}
    />
  )
}

function WarningIcon() {
  return (
    <TriangleAlert
      size={16}
      strokeWidth={ICON_STROKE}
      aria-hidden
      style={{ color: "var(--aurora-warn)", flex: "0 0 auto" }}
    />
  )
}

function CloseIcon() {
  return <X size={14} strokeWidth={ICON_STROKE} aria-hidden />
}

function TerminalIcon() {
  return <Terminal size={13} strokeWidth={ICON_STROKE} aria-hidden />
}

function isCommandTarget(target: string): boolean {
  return (
    target.startsWith("$") ||
    /^[a-z]+\s/.test(target) ||
    target.includes("&&") ||
    target.includes("|")
  )
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

interface ActionButtonsProps {
  isDangerous?: boolean
  onAllow?: () => void
  onDeny?: () => void
  onAllowAlways?: () => void
  allowLabel?: string
  denyLabel?: string
  compact?: boolean
}

function ActionButtons({
  isDangerous,
  onAllow,
  onDeny,
  onAllowAlways,
  allowLabel,
  denyLabel,
  compact,
}: ActionButtonsProps) {
  const gap = compact ? 6 : 8
  const size = compact ? "sm" : "default"

  return (
    <div style={{ display: "flex", alignItems: "center", gap, flexWrap: "wrap" }}>
      <Button
        type="button"
        variant={isDangerous ? "destructive" : "aurora"}
        size={size}
        onClick={onAllow}
      >
        {allowLabel ?? (isDangerous ? "Run anyway" : "Allow")}
      </Button>

      {!isDangerous && onAllowAlways && (
        <Button
          type="button"
          variant="neutral"
          size={size}
          onClick={onAllowAlways}
        >
          Allow always
        </Button>
      )}

      <Button
        type="button"
        variant="neutral"
        size={size}
        onClick={onDeny}
      >
        {denyLabel ?? "Deny"}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Target display (file/command chip)
// ---------------------------------------------------------------------------

function TargetChip({ target }: { target: string }) {
  const isCommand = isCommandTarget(target)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 8,
        background: "var(--aurora-control-surface)",
        border: "1px solid var(--aurora-border-default)",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <span style={{ color: "var(--aurora-text-muted)", flexShrink: 0 }}>
        <TerminalIcon />
      </span>
      <code
        style={{
          fontSize: 12,
          fontFamily: isCommand ? "var(--aurora-font-mono)" : "var(--aurora-font-sans)",
          color: isCommand ? "var(--aurora-accent-strong)" : "var(--aurora-text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {target}
      </code>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Danger warning strip
// ---------------------------------------------------------------------------

function DangerStrip() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 10,
        background: "color-mix(in srgb, var(--aurora-error) 8%, transparent)",
        border: "1px solid color-mix(in srgb, var(--aurora-error) 28%, transparent)",
      }}
    >
      <WarningIcon />
      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--aurora-error)",
          fontFamily: "var(--aurora-font-sans)",
          fontWeight: 500,
        }}
      >
        This operation may be destructive or irreversible. Review carefully before
        proceeding.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared content block
// ---------------------------------------------------------------------------

function PromptContent({
  tool,
  action,
  target,
  isDangerous,
  onAllow,
  onDeny,
  onAllowAlways,
  allowLabel,
  denyLabel,
  compact,
}: {
  tool: string
  action: string
  target?: string
  isDangerous?: boolean
  onAllow?: () => void
  onDeny?: () => void
  onAllowAlways?: () => void
  allowLabel?: string
  denyLabel?: string
  compact?: boolean
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 12 }}>
      {/* Tool + action */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <ShieldIcon danger={isDangerous} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: compact ? 12 : 13,
              fontWeight: 600,
              color: "var(--aurora-text-primary)",
              fontFamily: "var(--aurora-font-sans)",
              lineHeight: 1.4,
            }}
          >
            {tool}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: compact ? 11 : 12,
              color: "var(--aurora-text-muted)",
              fontFamily: "var(--aurora-font-sans)",
              lineHeight: 1.5,
            }}
          >
            {action}
          </p>
        </div>
      </div>

      {/* Target */}
      {target && <TargetChip target={target} />}

      {/* Danger warning */}
      {isDangerous && <DangerStrip />}

      {/* Buttons */}
      <ActionButtons
        isDangerous={isDangerous}
        onAllow={onAllow}
        onDeny={onDeny}
        onAllowAlways={onAllowAlways}
        allowLabel={allowLabel}
        denyLabel={denyLabel}
        compact={compact}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal variant
// ---------------------------------------------------------------------------

function ModalPrompt({
  tool,
  action,
  target,
  isDangerous,
  onAllow,
  onDeny,
  onAllowAlways,
  allowLabel,
  denyLabel,
  open = true,
  onOpenChange,
}: PermissionPromptProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onOpenChange?.(false)
        onDeny?.()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange, onDeny])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Permission request: ${tool}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--aurora-overlay)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange?.(false)
          onDeny?.()
        }
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          background: "var(--aurora-panel-strong)",
          border: isDangerous
            ? "1px solid color-mix(in srgb, var(--aurora-error) 40%, transparent)"
            : "1px solid var(--aurora-border-strong)",
          borderRadius: "var(--aurora-radius-2)",
          padding: 24,
          boxShadow: [
            "var(--aurora-shadow-strong)",
            isDangerous
              ? "0 0 0 1px color-mix(in srgb, var(--aurora-error) 15%, transparent)"
              : "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 6%, transparent)",
          ].join(", "),
        }}
      >
        {/* Close button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={() => {
            onOpenChange?.(false)
            onDeny?.()
          }}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
          }}
        >
          <CloseIcon />
        </Button>

        <div style={{ paddingRight: 32 }}>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isDangerous ? "var(--aurora-error)" : "var(--aurora-accent-primary)",
              fontFamily: "var(--aurora-font-sans)",
            }}
          >
            {isDangerous ? "Dangerous action" : "Permission required"}
          </p>

          <PromptContent
            tool={tool}
            action={action}
            target={target}
            isDangerous={isDangerous}
            onAllow={onAllow}
            onDeny={() => {
              onOpenChange?.(false)
              onDeny?.()
            }}
            onAllowAlways={onAllowAlways}
            allowLabel={allowLabel}
            denyLabel={denyLabel}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Banner variant (top-of-page inline strip)
// ---------------------------------------------------------------------------

function BannerPrompt({
  tool,
  action,
  target,
  isDangerous,
  onAllow,
  onDeny,
  onAllowAlways,
  allowLabel,
  denyLabel,
  open = true,
  onOpenChange,
  style,
}: PermissionPromptProps) {
  if (!open) return null
  const targetIsCommand = target ? isCommandTarget(target) : false

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        background: isDangerous
          ? "color-mix(in srgb, var(--aurora-error) 10%, var(--aurora-panel-strong))"
          : "var(--aurora-panel-strong)",
        borderBottom: isDangerous
          ? "1px solid color-mix(in srgb, var(--aurora-error) 40%, transparent)"
          : "1px solid var(--aurora-border-default)",
        boxShadow: isDangerous
          ? "0 2px 12px color-mix(in srgb, var(--aurora-error) 12%, transparent)"
          : "var(--aurora-shadow-medium)",
        ...style,
      }}
    >
      <ShieldIcon danger={isDangerous} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--aurora-text-primary)",
            fontFamily: "var(--aurora-font-sans)",
          }}
        >
          {tool}
        </span>
        <span
          style={{
            fontSize: 13,
            color: "var(--aurora-text-muted)",
            fontFamily: "var(--aurora-font-sans)",
            marginLeft: 6,
          }}
        >
          - {action}
        </span>
        {target && (
          <code
            style={{
              marginLeft: 8,
              fontSize: 11,
              fontFamily: targetIsCommand ? "var(--aurora-font-mono)" : "var(--aurora-font-sans)",
              color: "var(--aurora-accent-strong)",
              background: "var(--aurora-control-surface)",
              borderRadius: 5,
              padding: "1px 6px",
              border: "1px solid var(--aurora-border-default)",
            }}
          >
            {target}
          </code>
        )}
      </div>

      <ActionButtons
        isDangerous={isDangerous}
        onAllow={onAllow}
        onDeny={() => {
          onOpenChange?.(false)
          onDeny?.()
        }}
        onAllowAlways={onAllowAlways}
        allowLabel={allowLabel}
        denyLabel={denyLabel}
        compact
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Dismiss"
        onClick={() => {
          onOpenChange?.(false)
          onDeny?.()
        }}
        style={{
          flexShrink: 0,
        }}
      >
        <CloseIcon />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline variant (embedded in chat thread)
// ---------------------------------------------------------------------------

function InlinePrompt({
  tool,
  action,
  target,
  isDangerous,
  onAllow,
  onDeny,
  onAllowAlways,
  allowLabel,
  denyLabel,
  style,
}: PermissionPromptProps) {
  return (
    <div
      style={{
        // Uniform border on all four sides — no left-only accent spine. A thick
        // colored left border + border-radius arcs the accent around the rounded
        // corners (a lopsided "halo"); danger stays obvious via the tinted
        // surface, error-toned border, warning strip, red buttons, and shield.
        background: isDangerous
          ? "color-mix(in srgb, var(--aurora-error) 7%, var(--aurora-panel-medium))"
          : "var(--aurora-panel-medium)",
        border: isDangerous
          ? "1px solid color-mix(in srgb, var(--aurora-error) 45%, transparent)"
          : "1px solid var(--aurora-border-default)",
        borderRadius: "var(--aurora-radius-1)",
        padding: "14px 16px",
        ...style,
      }}
    >
      <PromptContent
        tool={tool}
        action={action}
        target={target}
        isDangerous={isDangerous}
        onAllow={onAllow}
        onDeny={onDeny}
        onAllowAlways={onAllowAlways}
        allowLabel={allowLabel}
        denyLabel={denyLabel}
        compact
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PermissionPrompt({ variant = "inline", ...props }: PermissionPromptProps) {
  if (variant === "modal") return <ModalPrompt {...props} variant={variant} />
  if (variant === "banner") return <BannerPrompt {...props} variant={variant} />
  return <InlinePrompt {...props} variant={variant} />
}

export default PermissionPrompt
