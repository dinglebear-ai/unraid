"use client"

import * as React from "react"
import { Brain, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"

// ---------------------------------------------------------------------------
// Reasoning — collapsible chain-of-thought summary.
//
// CD parity: orange rail + orange brain glyph, "Reasoned for Ns" / "Reasoning…"
// label, a streaming bullet, and a blinking cursor on the live tail. Axon orange
// is the AI/automation identity color. No violet.
//
// Architecture is kept standalone (not delegated to Thinking) so the Reasoning
// surface can carry its own reasoning styling without leaking into the
// shared Chain-of-thought / Plan variants.
// ---------------------------------------------------------------------------

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).
const AXON = "var(--axon-orange)"

export interface ReasoningProps {
  /** Streaming summary tail — shows the "Reasoning…" orange label, bullet and cursor. */
  isStreaming?: boolean
  /** Seconds spent reasoning — renders the "Reasoned for Ns" label. */
  duration?: number
  /** Start expanded. */
  defaultOpen?: boolean
  /** Reasoning body. Prefer children; `content` is kept for back-compat. */
  content?: string
  children?: React.ReactNode
}

// Blinking cursor for the live streaming tail.
function Cursor() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "2px",
        height: "1em",
        background: AXON,
        marginLeft: "2px",
        verticalAlign: "text-bottom",
        borderRadius: "1px",
        animation: "aurora-reasoning-blink 1s step-end infinite",
      }}
    />
  )
}

const Reasoning = function Reasoning({ ref, isStreaming, duration, defaultOpen, content, children }: ReasoningProps & { ref?: React.Ref<HTMLDivElement> }) {
    const [open, setOpen] = React.useState(defaultOpen ?? false)

    const label =
      duration !== undefined ? `Reasoned for ${duration}s` : isStreaming ? "Reasoning…" : "Reasoning"

    const body = children ?? content

    return (
      <div ref={ref} style={{ display: "block", width: "100%", minWidth: 0 }}>
        {/* Header — brain glyph + label + disclosure chevron */}
        <Button
          variant="plain"
          size="unstyled"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            display: "inline-flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            padding: "4px 0",
            maxWidth: "100%",
            minHeight: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Brain
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            style={{ color: AXON, flexShrink: 0 }}
          />

          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: 0,
              color: isStreaming ? AXON : "var(--aurora-text-primary)",
              minWidth: 0,
            }}
          >
            {label}
          </span>

          {isStreaming && (
            <span aria-hidden="true" style={{ color: AXON, fontSize: "15px", lineHeight: 1 }}>
              •
            </span>
          )}

          <ChevronDown
            size={16}
            aria-hidden="true"
            style={{
              color: "var(--aurora-text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </Button>

        {/* Body — orange left rail + reasoning text */}
        {open && (
          <div
            style={{
              borderLeft: `3px solid ${AXON}`,
              paddingLeft: "16px",
              marginLeft: "8px",
              fontSize: "var(--aurora-type-body)",
              lineHeight: "var(--aurora-line-body)",
              color: "var(--aurora-text-muted)",
              whiteSpace: "pre-wrap",
            }}
          >
            {body}
            {isStreaming && <Cursor />}
          </div>
        )}
      </div>
    )
  }

Reasoning.displayName = "Reasoning"

const MemoReasoning = React.memo(Reasoning)
MemoReasoning.displayName = "Reasoning"

export { MemoReasoning as Reasoning }
export default MemoReasoning
