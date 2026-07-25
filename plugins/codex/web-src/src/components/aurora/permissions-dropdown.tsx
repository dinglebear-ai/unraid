"use client"

import * as React from "react"
import { ChevronDown, Power, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolPermissionState = "allow" | "ask" | "block"

export interface ToolPermission {
  id: string
  name: string
  description?: string
  state: ToolPermissionState
}

export interface PermissionsDropdownProps {
  tools: ToolPermission[]
  onUpdate: (id: string, state: ToolPermissionState) => void
  /** When false, all tools show as disabled / blocked */
  masterEnabled?: boolean
  onMasterToggle?: (enabled: boolean) => void
  className?: string
  style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// State config
// ---------------------------------------------------------------------------

const ICON_STROKE = 1.7

const STATE_CONFIG: Record<
  ToolPermissionState,
  { label: string; color: string; bg: string; border: string }
> = {
  allow: {
    label: "Allow",
    color: "var(--aurora-success)",
    bg: "color-mix(in srgb, var(--aurora-success) 12%, transparent)",
    border: "color-mix(in srgb, var(--aurora-success) 30%, transparent)",
  },
  ask: {
    label: "Ask",
    color: "var(--aurora-accent-primary)",
    bg: "color-mix(in srgb, var(--aurora-accent-primary) 12%, transparent)",
    border: "color-mix(in srgb, var(--aurora-accent-primary) 30%, transparent)",
  },
  block: {
    label: "Block",
    color: "var(--aurora-error)",
    bg: "color-mix(in srgb, var(--aurora-error) 12%, transparent)",
    border: "color-mix(in srgb, var(--aurora-error) 30%, transparent)",
  },
}

// ---------------------------------------------------------------------------
// Segmented state control (Allow | Ask | Block per row)
// ---------------------------------------------------------------------------

function SegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: ToolPermissionState
  onChange: (v: ToolPermissionState) => void
  disabled?: boolean
}) {
  const states: ToolPermissionState[] = ["allow", "ask", "block"]

  return (
    <div
      role="radiogroup"
      style={{
        display: "inline-flex",
        borderRadius: 9,
        border: "1px solid var(--aurora-border-default)",
        background: "var(--aurora-control-surface)",
        padding: 2,
        gap: 1,
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {states.map((s) => {
        const active = value === s
        const cfg = STATE_CONFIG[s]
        return (
          <Button variant="plain" size="unstyled"
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 24,
              padding: "0 8px",
              borderRadius: 7,
              border: active ? `1px solid ${cfg.border}` : "1px solid transparent",
              background: active ? cfg.bg : "transparent",
              color: active ? cfg.color : "var(--aurora-text-muted)",
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              fontFamily: "var(--aurora-font-sans)",
              cursor: "pointer",
              transition: "background 120ms, color 120ms, border-color 120ms",
              whiteSpace: "nowrap",
            }}
          >
            {cfg.label}
          </Button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Master toggle (power icon + label)
// ---------------------------------------------------------------------------

function MasterToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: (v: boolean) => void
}) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderBottom: "1px solid var(--aurora-border-default)",
        background: "var(--aurora-panel-strong)",
      }}
    >
      {/* Power icon */}
      <Power
        size={15}
        strokeWidth={ICON_STROKE}
        aria-hidden="true"
        style={{ color: enabled ? "var(--aurora-accent-primary)" : "var(--aurora-text-muted)" }}
      />

      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--aurora-text-primary)",
          fontFamily: "var(--aurora-font-sans)",
        }}
      >
        Tool permissions
      </span>

      {/* Toggle pill */}
      <Button variant="plain" size="unstyled"
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          height: 26,
          padding: "0 10px",
          borderRadius: 10,
          border: enabled
            ? "1px solid color-mix(in srgb, var(--aurora-accent-primary) 35%, transparent)"
            : "1px solid var(--aurora-border-default)",
          background: enabled
            ? hovered
              ? "color-mix(in srgb, var(--aurora-accent-primary) 20%, var(--aurora-control-surface))"
              : "color-mix(in srgb, var(--aurora-accent-primary) 12%, var(--aurora-control-surface))"
            : hovered
            ? "var(--aurora-hover-bg)"
            : "transparent",
          color: enabled ? "var(--aurora-accent-primary)" : "var(--aurora-text-muted)",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "var(--aurora-font-sans)",
          cursor: "pointer",
          transition: "background 120ms, border-color 120ms, color 120ms",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: enabled ? "var(--aurora-accent-primary)" : "var(--aurora-text-muted)",
            transition: "background 120ms",
          }}
        />
        {enabled ? "Enabled" : "Disabled"}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tool row
// ---------------------------------------------------------------------------

function ToolRow({
  tool,
  onUpdate,
  masterEnabled,
}: {
  tool: ToolPermission
  onUpdate: (id: string, state: ToolPermissionState) => void
  masterEnabled: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        opacity: masterEnabled ? 1 : 0.45,
        transition: "opacity 150ms",
      }}
    >
      {/* Tool info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--aurora-text-primary)",
            fontFamily: "var(--aurora-font-sans)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tool.name}
        </p>
        {tool.description && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 11,
              color: "var(--aurora-text-muted)",
              fontFamily: "var(--aurora-font-sans)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tool.description}
          </p>
        )}
      </div>

      {/* Segmented control */}
      <SegmentedControl
        value={tool.state}
        onChange={(s) => onUpdate(tool.id, s)}
        disabled={!masterEnabled}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PermissionsDropdown — the main panel
// ---------------------------------------------------------------------------

export function PermissionsDropdown({
  tools,
  onUpdate,
  masterEnabled = true,
  onMasterToggle,
  className,
  style,
}: PermissionsDropdownProps) {
  const [internalMaster, setInternalMaster] = React.useState(masterEnabled)
  const isEnabled = onMasterToggle !== undefined ? masterEnabled : internalMaster

  function handleMasterToggle(v: boolean) {
    setInternalMaster(v)
    onMasterToggle?.(v)
  }

  const allowCount = tools.filter((t) => t.state === "allow").length
  const blockCount = tools.filter((t) => t.state === "block").length

  return (
    <div
      className={className}
      style={{
        background: "var(--aurora-panel-medium)",
        border: "1px solid var(--aurora-border-strong)",
        borderRadius: "var(--aurora-radius-2)",
        overflow: "hidden",
        boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-medium)",
        animation: "aurora-pd-in 180ms cubic-bezier(0.4,0,0.2,1) both",
        ...style,
      }}
    >
      {/* Master toggle */}
      <MasterToggle enabled={isEnabled} onToggle={handleMasterToggle} />

      {/* Summary strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderBottom: "1px solid var(--aurora-border-default)",
          background: "color-mix(in srgb, var(--aurora-panel-strong) 60%, transparent)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--aurora-text-muted)",
            fontFamily: "var(--aurora-font-sans)",
          }}
        >
          {tools.length} tool{tools.length !== 1 ? "s" : ""}
        </span>
        {blockCount > 0 && (
          <>
            <span style={{ color: "var(--aurora-border-default)", fontSize: 11 }}>·</span>
            <span
              style={{
                fontSize: 11,
                color: "var(--aurora-error)",
                fontFamily: "var(--aurora-font-sans)",
              }}
            >
              {blockCount} blocked
            </span>
          </>
        )}
        {allowCount > 0 && (
          <>
            <span style={{ color: "var(--aurora-border-default)", fontSize: 11 }}>·</span>
            <span
              style={{
                fontSize: 11,
                color: "var(--aurora-success)",
                fontFamily: "var(--aurora-font-sans)",
              }}
            >
              {allowCount} allowed
            </span>
          </>
        )}
      </div>

      {/* Tool rows */}
      <div
        style={{
          maxHeight: 360,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tools.map((tool, i) => (
          <div
            key={tool.id}
            style={{
              borderBottom:
                i < tools.length - 1
                  ? "1px solid var(--aurora-border-default)"
                  : "none",
            }}
          >
            <ToolRow
              tool={tool}
              onUpdate={onUpdate}
              masterEnabled={isEnabled}
            />
          </div>
        ))}
        {tools.length === 0 && (
          <div
            style={{
              padding: "24px 14px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--aurora-text-muted)",
              fontFamily: "var(--aurora-font-sans)",
            }}
          >
            No tools configured
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PermissionChip — compact summary chip
// ---------------------------------------------------------------------------

export interface PermissionChipProps {
  tools: ToolPermission[]
  onClick?: () => void
  /** Render only the shield for dense composer toolbars. */
  iconOnly?: boolean
  style?: React.CSSProperties
  className?: string
}

export function PermissionChip({
  tools,
  onClick,
  iconOnly = false,
  style,
  className,
}: PermissionChipProps) {
  const [hovered, setHovered] = React.useState(false)
  const restrictedCount = tools.filter(
    (t) => t.state === "block" || t.state === "ask"
  ).length
  const totalCount = tools.length

  const hasRestrictions = restrictedCount > 0
  const ShieldIcon = hasRestrictions ? ShieldAlert : ShieldCheck

  return (
    <Button variant="plain" size="unstyled"
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: iconOnly ? 0 : "0 10px",
        width: iconOnly ? 26 : undefined,
        justifyContent: "center",
        borderRadius: 9,
        border: hasRestrictions
          ? "1px solid color-mix(in srgb, var(--aurora-warn) 30%, var(--aurora-border-default))"
          : "1px solid var(--aurora-border-default)",
        background: hovered
          ? "var(--aurora-hover-bg)"
          : hasRestrictions
          ? "color-mix(in srgb, var(--aurora-warn) 6%, var(--aurora-control-surface))"
          : "var(--aurora-control-surface)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 120ms, border-color 120ms",
        ...style,
      }}
    >
      {/* Shield icon */}
      <ShieldIcon
        size={12}
        strokeWidth={ICON_STROKE}
        aria-hidden="true"
        style={{ color: hasRestrictions ? "var(--aurora-warn)" : "var(--aurora-accent-primary)" }}
      />

      {/* Label */}
      {!iconOnly && <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--aurora-text-muted)",
          fontFamily: "var(--aurora-font-sans)",
          whiteSpace: "nowrap",
        }}
      >
        {totalCount} tool{totalCount !== 1 ? "s" : ""}
      </span>}

      {/* Restriction count */}
      {hasRestrictions && !iconOnly && (
        <>
          <span
            style={{ color: "var(--aurora-border-default)", fontSize: 11 }}
          >
            ·
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--aurora-warn)",
              fontFamily: "var(--aurora-font-sans)",
              whiteSpace: "nowrap",
            }}
          >
            {restrictedCount} restricted
          </span>
        </>
      )}

      {/* Chevron (when clickable) */}
      {onClick && !iconOnly && (
        <ChevronDown
          size={10}
          strokeWidth={ICON_STROKE}
          aria-hidden="true"
          style={{ color: "var(--aurora-text-muted)", marginLeft: 2 }}
        />
      )}
    </Button>
  )
}

export default PermissionsDropdown
