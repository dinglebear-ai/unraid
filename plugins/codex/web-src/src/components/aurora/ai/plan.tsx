import * as React from "react"
import { Check, CircleAlert, ListChecks } from "lucide-react"

// ---------------------------------------------------------------------------
// Aurora "Plan" — execution-plan card (CD-parity).
//
// Self-contained shadcn-registry implementation: a titled card with a progress
// bar and a vertical status rail (done / inprog / pending / error per step).
// Axon orange is the AI/automation identity color; success/error use the
// semantic token layer. No violet.
// ---------------------------------------------------------------------------

export type PlanStepStatus = "pending" | "inprog" | "done" | "error"

export interface PlanStep {
  label: string
  status: PlanStepStatus
  detail?: string
}

export interface PlanProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  steps?: PlanStep[]
  /** Show a blinking cursor after the in-progress step's label. */
  isStreaming?: boolean
}

// Accents -------------------------------------------------------------------
const PLAN_ACCENT = "var(--axon-orange)"

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

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
        background: PLAN_ACCENT,
        marginLeft: "2px",
        verticalAlign: "text-bottom",
        borderRadius: "1px",
        animation: "aurora-plan-blink 1s step-end infinite",
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Status node (the rail markers)
// ---------------------------------------------------------------------------

const NODE_SIZE = 22

function StepNode({ status }: { status: PlanStepStatus }) {
  const base: React.CSSProperties = {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  }

  if (status === "done") {
    return (
      <span
        role="img"
        aria-label="Done"
        style={{
          ...base,
          border: "1.5px solid var(--aurora-success-border)",
          background: "var(--aurora-success-surface)",
          color: "var(--aurora-success)",
        }}
      >
        <Check size={12} strokeWidth={2.4} aria-hidden="true" />
      </span>
    )
  }

  if (status === "inprog") {
    return (
      <span
        role="img"
        aria-label="In progress"
        style={{
          ...base,
          border: `2px solid ${PLAN_ACCENT}`,
          borderTopColor: "transparent",
          background: "transparent",
          animation: "aurora-plan-spin 0.8s linear infinite",
        }}
      />
    )
  }

  if (status === "error") {
    return (
      <span
        role="img"
        aria-label="Error"
        style={{
          ...base,
          border: "1.5px solid var(--aurora-error)",
          background: "var(--aurora-error-surface)",
          color: "var(--aurora-error)",
        }}
      >
        <CircleAlert size={13} strokeWidth={2.2} aria-hidden="true" />
      </span>
    )
  }

  // pending
  return (
    <span
      role="img"
      aria-label="Pending"
      style={{
        ...base,
        border: "1.5px solid var(--aurora-border-strong)",
        background: "transparent",
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export const Plan = function Plan(
  { ref, title = "Plan", steps = [], isStreaming, style, ...rest }: PlanProps & { ref?: React.Ref<HTMLDivElement> }
) {
  const total = steps.length
  const doneCount = steps.filter((s) => s.status === "done").length
  const progress = total > 0 ? doneCount / total : 0

  return (
    <div
      ref={ref}
      role="group"
      aria-label={title}
      style={{
        background: "var(--aurora-surface-raised)",
        border: "1px solid var(--aurora-border-strong)",
        borderRadius: "var(--aurora-radius-2)",
        boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
        padding: "20px 22px",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
      {...rest}
    >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <ListChecks
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            style={{ color: PLAN_ACCENT, flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--aurora-text-primary)",
              letterSpacing: 0,
              minWidth: 0,
              flex: "1 1 auto",
            }}
          >
            {title}
          </span>
          {total > 0 && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--aurora-text-muted)",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}
            >
              {doneCount}/{total}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
            style={{
              marginTop: "14px",
              height: "6px",
              borderRadius: "999px",
              background: "var(--aurora-border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(progress * 100)}%`,
                borderRadius: "999px",
                background: "linear-gradient(90deg, var(--axon-orange-deep), var(--axon-orange))",
                transition: "width var(--motion-duration-fast, 160ms) var(--motion-ease-out, ease)",
              }}
            />
          </div>
        )}

        {/* Step rail */}
        <ol
          style={{
            listStyle: "none",
            margin: "16px 0 0",
            padding: 0,
          }}
        >
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  position: "relative",
                  paddingBottom: isLast ? 0 : "8px",
                }}
              >
                {/* Connector line */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: `${NODE_SIZE / 2 - 0.5}px`,
                      top: `${NODE_SIZE + 2}px`,
                      bottom: "-2px",
                      width: "1px",
                      borderLeft:
                        step.status === "done"
                            ? "1px solid var(--aurora-success-border)"
                          : "1px dashed var(--axon-orange-border)",
                    }}
                  />
                )}

                <StepNode status={step.status} />

                <div style={{ flex: 1, minWidth: 0, paddingTop: "1px", paddingBottom: "6px" }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: step.status === "inprog" ? 700 : 600,
                      lineHeight: 1.35,
                      color:
                        step.status === "done"
                          ? "var(--aurora-text-muted)"
                          : "var(--aurora-text-primary)",
                      textDecoration: step.status === "done" ? "line-through" : "none",
                    }}
                  >
                    {step.label}
                    {isStreaming && step.status === "inprog" && <Cursor />}
                  </div>
                  {step.detail && (
                    <div
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.4,
                        marginTop: "3px",
                        color:
                          step.status === "inprog"
                            ? PLAN_ACCENT
                            : "var(--aurora-text-muted)",
                      }}
                    >
                      {step.detail}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
    </div>
  )
}

Plan.displayName = "Plan"

export default Plan
