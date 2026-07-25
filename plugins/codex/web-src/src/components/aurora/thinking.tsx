import * as React from "react"
import { Brain, CircleCheck, ChevronDown, Circle, CircleAlert, ListChecks, ListTree } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { Skeleton } from "@/components/ui/aurora/skeleton"

// Axon orange marks AI/automation identity.
// Do not use for semantic state (success/warn/error) — use the semantic token layer for that.
const AI_ACCENT = "var(--axon-orange)"
const PLAN_ROW_BACKGROUND = {
  inprog: "var(--axon-orange-surface)",
  error: "var(--aurora-error-surface)",
} as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepStatus = "pending" | "inprog" | "done" | "error"

export interface Step {
  label: string
  status: StepStatus
  detail?: string
}

export interface ThinkingProps {
  type?: "thinking" | "cot" | "plan"
  steps?: Step[]
  isStreaming?: boolean
  duration?: number
  defaultOpen?: boolean
  content?: string
}

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ---------------------------------------------------------------------------
// Step status icon
// ---------------------------------------------------------------------------

function StepIcon({ status }: { status: StepStatus }) {
  const iconProps = { size: 16, strokeWidth: 1.6, "aria-hidden": true } as const

  if (status === "pending") {
    return <Circle {...iconProps} aria-label="Pending" style={{ color: "var(--aurora-border-strong)", flexShrink: 0 }} />
  }
  if (status === "inprog") {
    return (
      <span
        style={{
          display: "inline-block",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          border: `2px solid ${AI_ACCENT}`,
          borderTopColor: "transparent",
          animation: "aurora-spin 0.7s linear infinite",
          flexShrink: 0,
        }}
        aria-label="In progress"
      />
    )
  }
  if (status === "error") {
    return <CircleAlert {...iconProps} aria-label="Error" style={{ color: "var(--aurora-error)", flexShrink: 0 }} />
  }
  return <CircleCheck {...iconProps} aria-label="Done" style={{ color: "var(--aurora-success)", flexShrink: 0 }} />
}

// ---------------------------------------------------------------------------
// Shimmer skeleton
// ---------------------------------------------------------------------------

function SkeletonLines({ id }: { id: string }) {
  return (
    <div
      id={id}
      role="status"
      aria-label="Reasoning in progress"
      style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px" }}
    >
      {[100, 85, 92, 70].map((w, i) => (
        <Skeleton
          key={i}
          width={`${w}%`}
          height={11}
          style={{
            borderRadius: "6px",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Blinking cursor
// ---------------------------------------------------------------------------

function Cursor() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "2px",
        height: "1em",
        background: AI_ACCENT,
        marginLeft: "2px",
        verticalAlign: "text-bottom",
        borderRadius: "1px",
        animation: "aurora-blink 1s step-end infinite",
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Thinking variant
// ---------------------------------------------------------------------------

function ThinkingBlock({
  isStreaming,
  content,
  duration,
  defaultOpen,
}: {
  isStreaming?: boolean
  content?: string
  duration?: number
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false)
  const reactId = React.useId()
  const contentId = `${reactId}-thinking-content`

  const borderLeftColor = isStreaming ? AI_ACCENT : "var(--aurora-border-strong)"

  const showSkeleton = isStreaming && !content
  const label = isStreaming && !duration
    ? "Thinking…"
    : duration !== undefined
    ? `Thought for ${duration}s`
    : "Reasoning"

  return (
    <div
      aria-busy={isStreaming}
      style={{
        display: open ? "block" : "inline-block",
        width: open ? "100%" : "max-content",
        minWidth: 0,
        border: open ? `1px solid var(--aurora-border-strong)` : `1px solid ${borderLeftColor}`,
        borderLeft: open ? `3px solid ${borderLeftColor}` : `1px solid ${borderLeftColor}`,
        borderRadius: open ? "var(--aurora-radius-2)" : "999px",
        background: open ? "var(--aurora-surface-raised)" : "var(--aurora-panel-strong)",
        boxShadow: open ? "var(--aurora-shadow-medium), var(--aurora-highlight-medium)" : "var(--aurora-highlight-medium)",
        animation: isStreaming ? "aurora-border-pulse 1.8s ease-in-out infinite" : "none",
        transition: "border-color 0.3s, width 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <Button variant="plain" size="unstyled"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        style={{
          display: open ? "flex" : "inline-flex",
          alignItems: "center",
          gap: "8px",
          width: open ? "100%" : "auto",
          justifyContent: "center",
          padding: open ? "8px 14px" : "8px",
          minHeight: 32,
          minWidth: open ? 0 : 32,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Brain size={14} strokeWidth={1.8} aria-hidden="true" style={{ color: AI_ACCENT, flexShrink: 0 }} />

        {open && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--aurora-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        )}

        {open && (
          <ChevronDown
            size={12}
            aria-hidden="true"
            style={{
              marginLeft: "auto",
              color: "var(--aurora-text-muted)",
              transform: "rotate(180deg)",
              transition: "transform 0.2s",
            }}
          />
        )}
      </Button>

      {open && (
        showSkeleton ? (
          <SkeletonLines id={contentId} />
        ) : (
          <div
            id={contentId}
            role="region"
            aria-label="Reasoning details"
            style={{
              padding: "0 14px 12px",
              fontSize: "13px",
              lineHeight: "1.7",
              color: "var(--aurora-text-muted)",
              whiteSpace: "pre-wrap",
            }}
          >
            {content ?? "No reasoning captured."}
            {isStreaming && <Cursor />}
          </div>
        )
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CoT (numbered steps with connector line) variant
// ---------------------------------------------------------------------------

function CotBlock({
  steps = [],
  isStreaming,
  defaultOpen,
}: {
  steps?: Step[]
  isStreaming?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false)
  const reactId = React.useId()
  const contentId = `${reactId}-chain-of-thought-content`

  return (
    <div aria-busy={isStreaming}>
      <Button variant="plain" size="unstyled"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center",
          padding: open ? "8px 14px" : "8px",
          minHeight: 32,
          minWidth: open ? 0 : 32,
          background: "none",
          border: "none",
          cursor: "pointer",
          width: open ? "100%" : "auto",
          textAlign: "left",
        }}
      >
        <ListTree size={14} strokeWidth={1.8} aria-hidden="true" style={{ color: AI_ACCENT, flexShrink: 0 }} />
        {open && (
          <>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--aurora-text-muted)" }}>
              Chain of Thought
              {steps.length > 0 && ` · ${steps.length} steps`}
            </span>
            <ChevronDown
              size={12}
              aria-hidden="true"
              style={{
                marginLeft: "auto",
                color: "var(--aurora-text-muted)",
                transform: "rotate(180deg)",
                transition: "transform 0.2s",
              }}
            />
          </>
        )}
      </Button>

      {open && (
        <div id={contentId} role="region" aria-label="Chain of Thought steps" style={{ padding: "4px 14px 12px" }}>
          {steps.length === 0 ? (
            <p
              style={{
                margin: 0,
                color: "var(--aurora-text-muted)",
                fontFamily: "var(--aurora-font-sans)",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              No reasoning steps captured.
            </p>
          ) : (
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {steps.map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "10px",
                  position: "relative",
                  paddingBottom: i < steps.length - 1 ? "16px" : "0",
                }}
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "20px",
                      bottom: "0",
                      width: "1px",
                      background: "var(--aurora-border-default)",
                    }}
                  />
                )}

                {/* Number badge */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "var(--aurora-control-surface)",
                    border: "1px solid var(--aurora-border-default)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--aurora-text-muted)",
                    flexShrink: 0,
                    zIndex: 1,
                    position: "relative",
                  }}
                >
                  {i + 1}
                </div>

                <div style={{ paddingTop: "3px", flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--aurora-text-primary)",
                      lineHeight: "1.5",
                    }}
                  >
                    {step.label}
                    {isStreaming && i === steps.length - 1 && <Cursor />}
                  </div>
                  {step.detail && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--aurora-text-muted)",
                        marginTop: "2px",
                        lineHeight: "1.5",
                      }}
                    >
                      {step.detail}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Plan variant (step list with status icons)
// ---------------------------------------------------------------------------

function PlanBlock({
  steps = [],
  isStreaming,
  defaultOpen,
}: {
  steps?: Step[]
  isStreaming?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false)
  const reactId = React.useId()
  const contentId = `${reactId}-plan-content`
  const doneCount = steps.filter((s) => s.status === "done").length

  return (
    <div aria-busy={isStreaming}>
      <Button variant="plain" size="unstyled"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center",
          padding: open ? "8px 14px" : "8px",
          minHeight: 32,
          minWidth: open ? 0 : 32,
          background: "none",
          border: "none",
          cursor: "pointer",
          width: open ? "100%" : "auto",
          textAlign: "left",
        }}
      >
        <ListChecks size={14} strokeWidth={1.8} aria-hidden="true" style={{ color: AI_ACCENT, flexShrink: 0 }} />
        {open && (
          <>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--aurora-text-muted)" }}>
              Plan
            </span>
            {steps.length > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--aurora-text-muted)",
                  background: "var(--aurora-control-surface)",
                  padding: "1px 7px",
                  borderRadius: "20px",
                  border: "1px solid var(--aurora-border-default)",
                }}
              >
                {doneCount}/{steps.length}
              </span>
            )}
            <ChevronDown
              size={12}
              aria-hidden="true"
              style={{
                marginLeft: "auto",
                color: "var(--aurora-text-muted)",
                transform: "rotate(180deg)",
                transition: "transform 0.2s",
              }}
            />
          </>
        )}
      </Button>

      {open && (
        <div
          id={contentId}
          role="region"
          aria-label="Plan steps"
          style={{ padding: "4px 14px 12px", display: "flex", flexDirection: "column", gap: "2px" }}
        >
          {steps.length === 0 && (
            <p
              style={{
                margin: 0,
                color: "var(--aurora-text-muted)",
                fontFamily: "var(--aurora-font-sans)",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              No plan steps captured.
            </p>
          )}
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "10px",
                border:
                  step.status === "inprog"
                    ? "1px solid var(--axon-orange-border)"
                    : step.status === "error"
                    ? "1px solid var(--aurora-error-border)"
                    : "1px solid transparent",
                background:
                  step.status === "inprog" || step.status === "error"
                    ? PLAN_ROW_BACKGROUND[step.status]
                    : "transparent",
              }}
            >
              <StepIcon status={step.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    color:
                      step.status === "done"
                        ? "var(--aurora-text-muted)"
                        : "var(--aurora-text-primary)",
                    textDecoration: step.status === "done" ? "line-through" : "none",
                    lineHeight: "1.4",
                  }}
                >
                  {step.label}
                  {isStreaming && step.status === "inprog" && <Cursor />}
                </div>
                {step.detail && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--aurora-text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Thinking({
  type = "thinking",
  steps,
  isStreaming,
  duration,
  defaultOpen,
  content,
}: ThinkingProps) {
  return (
    <>
      {type === "thinking" && (
        <ThinkingBlock
          isStreaming={isStreaming}
          content={content}
          duration={duration}
          defaultOpen={defaultOpen}
        />
      )}
      {type !== "thinking" && (
        <div
          style={{
            background: "var(--aurora-surface-raised)",
            border: "1px solid var(--aurora-border-strong)",
            borderRadius: "var(--aurora-radius-2)",
            overflow: "hidden",
            boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
            display: "inline-block",
            width: "fit-content",
            maxWidth: "min(100%, 560px)",
          }}
        >
          {type === "cot" && (
          <CotBlock steps={steps} isStreaming={isStreaming} defaultOpen={defaultOpen} />
          )}
          {type === "plan" && (
            <PlanBlock steps={steps} isStreaming={isStreaming} defaultOpen={defaultOpen} />
          )}
        </div>
      )}
    </>
  )
}

export default Thinking
