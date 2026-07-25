import * as React from "react"

export interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  length?: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Render a separator dot after the segment at this 1-based index. */
  separatorAfter?: number
  disabled?: boolean
  autoFocus?: boolean
}

export function InputOTP({
  length = 6,
  value: valueProp,
  defaultValue = "",
  onChange,
  separatorAfter,
  disabled = false,
  autoFocus = false,
  className,
  style,
  ...props
}: InputOTPProps) {
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const value = isControlled ? valueProp : internalValue
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([])

  const chars = value.padEnd(length).slice(0, length).split("")

  const commit = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  const focusIndex = React.useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index))
    const next = inputRefs.current[clamped]
    next?.focus()
    next?.select()
  }, [length])

  const writeChars = React.useCallback(
    (startIndex: number, raw: string) => {
      const sanitized = raw.replace(/\s+/g, "")
      if (!sanitized) return
      const next = chars.slice()
      let cursor = startIndex
      for (const char of sanitized) {
        if (cursor >= length) break
        next[cursor] = char
        cursor += 1
      }
      commit(next.join("").trimEnd())
      focusIndex(Math.min(cursor, length - 1))
    },
    [chars, commit, focusIndex, length]
  )

  return (
    <div
      role="group"
      aria-label="One-time passcode"
      className={["flex items-center", className].filter(Boolean).join(" ")}
      style={{ gap: "12px", ...style }}
      {...props}
    >
      {chars.map((char, index) => {
        const filled = char.trim().length > 0
        return (
          <React.Fragment key={index}>
            <input
              aria-label={`Digit ${index + 1}`}
              autoFocus={autoFocus && index === 0}
              autoComplete={index === 0 ? "one-time-code" : undefined}
              disabled={disabled}
              inputMode="numeric"
              maxLength={1}
              value={char.trim()}
              ref={(node) => {
                inputRefs.current[index] = node
              }}
              onChange={(event) => {
                const raw = event.target.value
                if (raw.length > 1) {
                  writeChars(index, raw)
                  return
                }
                const next = chars.slice()
                next[index] = raw.slice(-1)
                commit(next.join("").trimEnd())
                if (raw) {
                  focusIndex(index + 1)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace") {
                  event.preventDefault()
                  const next = chars.slice()
                  if (next[index]) {
                    next[index] = ""
                    commit(next.join("").trimEnd())
                    return
                  }
                  if (index > 0) {
                    next[index - 1] = ""
                    commit(next.join("").trimEnd())
                    focusIndex(index - 1)
                  }
                  return
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault()
                  focusIndex(index - 1)
                  return
                }
                if (event.key === "ArrowRight") {
                  event.preventDefault()
                  focusIndex(index + 1)
                  return
                }
                if (event.key === "Home") {
                  event.preventDefault()
                  focusIndex(0)
                  return
                }
                if (event.key === "End") {
                  event.preventDefault()
                  focusIndex(length - 1)
                }
              }}
              onPaste={(event) => {
                event.preventDefault()
                writeChars(index, event.clipboardData.getData("text"))
              }}
              onFocus={(e) => {
                e.currentTarget.select()
                e.currentTarget.style.borderColor =
                  "color-mix(in srgb, var(--aurora-accent-primary) 70%, var(--aurora-border-strong))"
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px var(--aurora-focus-ring), 0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 55%, transparent)"
              }}
              onBlur={(e) => {
                const latestFilled = (value.padEnd(length).slice(0, length).split("")[index] ?? "").trim().length > 0
                e.currentTarget.style.borderColor = latestFilled
                  ? "color-mix(in srgb, var(--aurora-accent-primary) 55%, var(--aurora-border-strong))"
                  : "var(--aurora-border-strong)"
                e.currentTarget.style.boxShadow = latestFilled
                  ? "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 22%, transparent), 0 0 18px color-mix(in srgb, var(--aurora-accent-primary) 14%, transparent)"
                  : "none"
              }}
              className="flex items-center justify-center text-center focus-visible:outline-none [&:focus-visible]:ring-0 disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                borderWidth: "1px",
                borderStyle: "solid",
                fontFamily: "var(--aurora-font-mono)",
                fontSize: "22px",
                fontWeight: 600,
                lineHeight: 1,
                transition: "border-color var(--motion-fast, 140ms) ease, box-shadow var(--motion-fast, 140ms) ease, background var(--motion-fast, 140ms) ease",
                background: filled
                  ? "color-mix(in srgb, var(--aurora-accent-primary) 10%, var(--aurora-control-surface))"
                  : "var(--aurora-control-surface)",
                borderColor: filled
                  ? "color-mix(in srgb, var(--aurora-accent-primary) 55%, var(--aurora-border-strong))"
                  : "var(--aurora-border-strong)",
                color: "var(--aurora-text-primary)",
                boxShadow: filled
                  ? "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 22%, transparent), 0 0 18px color-mix(in srgb, var(--aurora-accent-primary) 14%, transparent)"
                  : "none",
              }}
            />
            {separatorAfter === index + 1 && index + 1 < length ? (
              <span
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "8px",
                  color: "var(--aurora-text-muted)",
                  fontSize: "22px",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                ·
              </span>
            ) : null}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default InputOTP
