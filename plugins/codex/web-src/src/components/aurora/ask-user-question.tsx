import * as React from "react"
import { ArrowRight, Check, CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { EmptyState } from "@/components/ui/aurora/empty-state"
import { Textarea } from "@/components/ui/aurora/textarea"

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const QUESTION_ACCENT = "var(--axon-orange)"

export interface QuestionOption {
  id: string
  label: string
  description?: string
  /** Optional code snippet shown inside the card */
  preview?: string
}

export type QuestionType = "radio" | "multi" | "text"

export interface AskUserQuestionProps {
  question: string
  options?: QuestionOption[]
  type?: QuestionType
  onSubmit: (value: string | string[]) => void
  /** Placeholder for text input */
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Code preview panel inside an option card
// ---------------------------------------------------------------------------

function OptionCodePreview({ code }: { code: string }) {
  return (
    <pre
      style={{
        margin: "8px 0 0",
        padding: "8px 10px",
        borderRadius: "var(--aurora-radius-1)",
        background: "var(--aurora-bg)",
        border: "1px solid var(--aurora-border-default)",
        fontSize: 11,
        lineHeight: 1.6,
        fontFamily: "var(--aurora-font-mono)",
        color: "var(--aurora-text-primary)",
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        maxWidth: "100%",
      }}
    >
      <code>{code}</code>
    </pre>
  )
}

// ---------------------------------------------------------------------------
// Single option card
// ---------------------------------------------------------------------------

interface OptionCardProps {
  option: QuestionOption
  selected: boolean
  type: "radio" | "multi"
  onToggle: (id: string) => void
}

function OptionCard({ option, selected, type, onToggle }: OptionCardProps) {
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)

  const borderColor = selected
    ? QUESTION_ACCENT
    : focused
    ? "color-mix(in srgb, var(--axon-orange) 38%, var(--aurora-border-default))"
    : hovered
    ? "color-mix(in srgb, var(--axon-orange) 45%, var(--aurora-border-default))"
    : "var(--aurora-border-default)"

  const boxShadow = selected
    ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px color-mix(in srgb, var(--axon-orange) 24%, transparent), 0 2px 6px rgba(0,0,0,0.16)"
    : focused
    ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 2px color-mix(in srgb, var(--axon-orange) 18%, transparent)"
    : hovered
    ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px color-mix(in srgb, var(--axon-orange) 15%, transparent), 0 2px 6px rgba(0,0,0,0.16)"
    : "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.18)"

  // Top-lit panel gradient (CD parity): translucent light top stop over the
  // opaque panel tier, kept opaque→opaque to avoid the gradient-seam band.
  const surfaceTop = selected
    ? "color-mix(in srgb, var(--axon-orange) 14%, var(--aurora-panel-strong-top))"
    : "var(--aurora-panel-strong-top)"
  const surfaceBase = selected
    ? "color-mix(in srgb, var(--axon-orange) 8%, var(--aurora-panel-medium))"
    : hovered
    ? "var(--aurora-hover-bg)"
    : "var(--aurora-panel-medium)"
  const background = `linear-gradient(180deg, ${surfaceTop}, ${surfaceBase} 62%), ${surfaceBase}`

  return (
    <Button variant="plain" size="unstyled"
      type="button"
      role={type === "radio" ? "radio" : "checkbox"}
      aria-checked={selected}
      onClick={() => onToggle(option.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        width: "100%",
        padding: "18px 20px",
        borderRadius: "var(--aurora-radius-1)",
        border: `1px solid ${borderColor}`,
        background,
        cursor: "pointer",
        textAlign: "left",
        outline: "none",
        overflow: "hidden",
        transition: "border-color 150ms, background 150ms, box-shadow 150ms",
        boxShadow,
        animation: "aurora-auq-fadein 180ms ease both",
      }}
    >
      {/* Indicator */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 1,
          width: 22,
          height: 22,
          borderRadius: type === "radio" ? "50%" : 6,
          border: selected
            ? `1.5px solid ${QUESTION_ACCENT}`
            : "1.5px solid var(--aurora-border-strong)",
          background: selected ? QUESTION_ACCENT : "var(--aurora-control-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 150ms, border-color 150ms",
        }}
      >
        {selected && type === "radio" && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--aurora-page-bg)",
            }}
          />
        )}
        {selected && type === "multi" && (
          <Check size={12} strokeWidth={2} aria-hidden="true" style={{ color: "var(--aurora-page-bg)" }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "var(--aurora-text-primary)",
            fontFamily: "var(--aurora-font-sans)",
            lineHeight: 1.35,
          }}
        >
          {option.label}
        </p>
        {option.description && (
          <p
            style={{
              margin: "5px 0 0",
              fontSize: 15,
              color: "var(--aurora-text-muted)",
              fontFamily: "var(--aurora-font-sans)",
              lineHeight: 1.5,
            }}
          >
            {option.description}
          </p>
        )}
        {option.preview && <OptionCodePreview code={option.preview} />}
      </div>
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Text input variant
// ---------------------------------------------------------------------------

function TextInput({
  placeholder,
  onSubmit,
}: {
  placeholder?: string
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = React.useState("")
  const [focused, setFocused] = React.useState(false)

  function submit() {
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Textarea
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? "Type your answer…"}
        style={{
          width: "100%",
          resize: "vertical",
          minHeight: 80,
          padding: "10px 12px",
          borderRadius: "var(--aurora-radius-1)",
          border: focused
            ? `1.5px solid ${QUESTION_ACCENT}`
            : "1.5px solid var(--aurora-border-strong)",
          background: "var(--aurora-control-surface)",
          color: "var(--aurora-text-primary)",
          fontSize: 14,
          fontFamily: "var(--aurora-font-sans)",
          lineHeight: 1.6,
          outline: "none",
          transition: "border-color 150ms, box-shadow 150ms",
          boxShadow: focused
            ? [
                "0 0 0 3px color-mix(in srgb, var(--axon-orange) 18%, transparent)",
                "0 0 0 1px color-mix(in srgb, var(--axon-orange) 40%, transparent)",
              ].join(", ")
            : "none",
          boxSizing: "border-box",
        }}
      />
      <SubmitButton disabled={!value.trim()} onClick={submit} label="Submit" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------------

function SubmitButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <Button
      type="button"
      variant="neutral"
      size="lg"
      disabled={disabled}
      onClick={onClick}
      iconRight={<ArrowRight size={16} strokeWidth={1.65} aria-hidden="true" />}
      style={{
        gap: 8,
        alignSelf: "flex-end",
        background: "transparent",
        borderColor: "var(--axon-orange-border)",
        color: "var(--axon-orange)",
        boxShadow: "none",
      }}
    >
      {label}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AskUserQuestion({
  question,
  options = [],
  type = "radio",
  onSubmit,
  placeholder,
  className,
  style,
}: AskUserQuestionProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  function toggleOption(id: string) {
    if (type === "radio") {
      setSelectedIds([id])
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }
  }

  function handleSubmit() {
    if (type === "multi") {
      onSubmit(selectedIds)
    } else {
      onSubmit(selectedIds[0] ?? "")
    }
  }

  const canSubmit =
    type === "text" ? true : selectedIds.length > 0

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minWidth: 0,
        width: "100%",
        ...style,
      }}
      role={type === "radio" ? "radiogroup" : type === "multi" ? "group" : undefined}
      aria-label={type === "text" ? undefined : question}
    >
      {/* Question */}
      <p
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: "var(--aurora-text-primary)",
          fontFamily: "var(--aurora-font-sans)",
          lineHeight: 1.4,
        }}
      >
        {question}
      </p>

      {/* Text input */}
      {type === "text" ? (
        <TextInput placeholder={placeholder} onSubmit={(v) => onSubmit(v)} />
      ) : options.length === 0 ? (
        <EmptyState
          icon={<CircleHelp size={26} strokeWidth={1.6} />}
          title="No answer options."
          description="Provide options for radio or multi-select questions, or switch to a text answer."
          as="h3"
          style={{
            width: "100%",
            padding: "28px 24px",
            border: "1.5px dashed var(--aurora-border-default)",
            borderRadius: "var(--aurora-radius-2)",
            background: "var(--aurora-panel-medium)",
          }}
        />
      ) : (
        <>
          {/* Option cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {options.map((opt, i) => (
              <div
                key={opt.id}
                style={{
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <OptionCard
                  option={opt}
                  selected={selectedIds.includes(opt.id)}
                  type={type}
                  onToggle={toggleOption}
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SubmitButton
              onClick={handleSubmit}
              disabled={!canSubmit}
              label={type === "multi" ? `Confirm (${selectedIds.length})` : "Continue"}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default AskUserQuestion
