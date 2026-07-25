import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaState = "error" | "warn" | "success"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Auto-grow to fit content. */
  autoResize?: boolean
  /** Alias for {@link autoResize} — auto-grow the field to fit its content. */
  autoGrow?: boolean
  /** Show a live character counter pinned to the bottom-right. Pairs with `maxLength`. */
  showCount?: boolean
  /** Validation state. Sets border color and glow ring using Aurora status tokens. */
  state?: TextareaState
  /** Convenience alias for state="error". When both are set, `state` wins. */
  error?: boolean
  /** Render a bare textarea with no Aurora chrome. */
  unstyled?: boolean
}

const STATE_TOKENS = {
  error: {
    border: "var(--aurora-error)",
    ring: "var(--aurora-error)",
  },
  warn: {
    border: "var(--aurora-warn)",
    ring: "var(--aurora-warn)",
  },
  success: {
    border: "var(--aurora-success)",
    ring: "var(--aurora-success)",
  },
} as const

function stateRestShadow(color: string): string {
  return `0 0 0 1px color-mix(in srgb, ${color} 30%, transparent), var(--aurora-highlight-medium)`
}

function stateFocusShadow(color: string): string {
  return [
    `0 0 0 3px color-mix(in srgb, ${color} 22%, transparent)`,
    `0 0 0 1px color-mix(in srgb, ${color} 55%, transparent)`,
    "var(--aurora-highlight-medium)",
  ].join(", ")
}

function Textarea(
  {
    ref,
    className,
    autoResize = false,
    autoGrow = false,
    showCount = false,
    unstyled = false,
    style,
    state: stateProp,
    error,
    onChange,
    defaultValue,
    value,
    maxLength,
    ...props
  }: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }
) {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null)
    const grows = autoResize || autoGrow
    const effectiveState: TextareaState | undefined = stateProp ?? (error ? "error" : undefined)
    const tokens = effectiveState ? STATE_TOKENS[effectiveState] : null

    // Track length for the live counter (uncontrolled or controlled).
    const isControlled = value !== undefined
    const initial = String(value ?? defaultValue ?? "").length
    const [count, setCount] = React.useState(initial)
    const length = isControlled ? String(value ?? "").length : count

    // Merge external ref with internal ref
    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
      },
      [ref]
    )

    const resize = React.useCallback(() => {
      const el = internalRef.current
      if (!grows || !el) return
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }, [grows])

    // Size to content on mount (covers defaultValue) and when value changes.
    React.useLayoutEffect(() => {
      resize()
    }, [resize, value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (grows) resize()
        if (!isControlled) setCount(e.currentTarget.value.length)
        onChange?.(e)
      },
      [grows, resize, isControlled, onChange]
    )

    if (unstyled) {
      return (
        <textarea
          ref={setRef}
          className={className}
          style={style}
          defaultValue={defaultValue}
          value={value}
          maxLength={maxLength}
          onChange={onChange}
          {...props}
        />
      )
    }

    const textarea = (
      <textarea
        ref={setRef}
        className={cn(
          // Layout
          "flex min-h-[112px] w-full min-w-0 px-3.5 py-3",
          // Typography
          "font-[var(--aurora-font-sans)]",
          "text-[var(--aurora-text-primary)]",
          "placeholder:text-[var(--aurora-text-muted)]",
          // Border
          "border border-[var(--aurora-border-strong)]",
          // Rounded
          "rounded-[12px]",
          // Scrollbar
          "resize-y",
          // Transition
          "transition-all duration-150 ease-out",
          // Focus
          "focus-visible:outline-none",
          // Disabled
          "disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed",
          // Auto-grow overrides manual resize
          grows && "resize-none overflow-hidden",
          // Reserve room for the counter chip
          showCount && "pb-7",
          className
        )}
        style={{
          background: "var(--aurora-control-surface)",
          fontSize: "var(--aurora-type-body-sm)",
          fontWeight: "var(--aurora-weight-body)",
          letterSpacing: "var(--aurora-letter-ui)",
          lineHeight: "1.55",
          borderColor: tokens?.border ?? "var(--aurora-border-strong)",
          boxShadow: tokens ? stateRestShadow(tokens.ring) : "var(--aurora-highlight-medium)",
          ...style,
        }}
        defaultValue={defaultValue}
        value={value}
        maxLength={maxLength}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = tokens?.border ?? "var(--aurora-border-strong)"
          e.currentTarget.style.boxShadow = tokens
            ? stateFocusShadow(tokens.ring)
            : [
                "0 0 0 3px color-mix(in srgb, var(--aurora-accent-primary) 22%, transparent)",
                "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 45%, transparent)",
                "var(--aurora-highlight-medium)",
              ].join(", ")
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = tokens?.border ?? "var(--aurora-border-strong)"
          e.currentTarget.style.boxShadow = tokens ? stateRestShadow(tokens.ring) : "var(--aurora-highlight-medium)"
          props.onBlur?.(e)
        }}
        onChange={handleChange}
        {...props}
      />
    )

    if (!showCount) return textarea

    return (
      <div className="relative w-full">
        {textarea}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2.5 right-3 select-none tabular-nums"
          style={{
            fontFamily: "var(--aurora-font-mono)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "var(--aurora-letter-ui)",
            color: "var(--aurora-text-muted)",
          }}
        >
          {maxLength != null ? `${length}/${maxLength}` : length}
        </span>
      </div>
    )
}

export { Textarea }
export default Textarea
