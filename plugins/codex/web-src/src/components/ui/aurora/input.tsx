"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

function devWarn(message: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message)
  }
}

export type InputState = "error" | "warn" | "success"
export type InputSize = "sm" | "default" | "lg"

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Optional leading icon or adornment */
  startAdornment?: React.ReactNode
  /** Optional trailing icon or adornment */
  endAdornment?: React.ReactNode
  /**
   * Validation state. Sets border color and glow ring using Aurora status tokens.
   * - error: --aurora-error border + ring
   * - warn:  --aurora-warn border + ring
   * - success: --aurora-success border + ring
   */
  state?: InputState
  /**
   * Convenience alias for state="error". When both are set, `state` takes precedence.
   */
  error?: boolean
  /**
   * Input size variant.
   * - sm: h-7, caption font, px-2.5
   * - default: h-9 (original), body-sm font, px-3
   * - lg: h-10, control font, px-3.5
   * @default "default"
   */
  size?: InputSize
  /**
   * When true and the input has a value, shows a clear (×) button as the end adornment.
   * The clear button calls `onClear` if provided, otherwise fires `onChange` with an
   * empty synthetic-like event.
   */
  clearable?: boolean
  /** Callback fired when the clear button is clicked. Escape hatch for controlled inputs. */
  onClear?: () => void
  /**
   * Escape hatch. When true, renders a BARE `<input>` with no wrapper, no inline
   * style skin, no imperative focus handlers, and no adornment/clear logic — only
   * `className`, the forwarded `ref`, `type`, and the remaining props are applied,
   * so the consumer's className/CSS owns 100% of the appearance. The styled path
   * (default) is unaffected.
   * @default false
   */
  unstyled?: boolean
}

/** Token map for validation states */
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

/** Resting box-shadow for a state — subtle 1px ring */
function stateRestShadow(color: string): string {
  return `0 0 0 1px color-mix(in srgb, ${color} 30%, transparent)`
}

/** Focused box-shadow for a state — intensified double ring */
function stateFocusShadow(color: string): string {
  return [
    `0 0 0 3px color-mix(in srgb, ${color} 22%, transparent)`,
    `0 0 0 1px color-mix(in srgb, ${color} 55%, transparent)`,
  ].join(", ")
}

/** Default focus box-shadow (no state) */
const DEFAULT_FOCUS_SHADOW = [
  "0 0 0 3px color-mix(in srgb, var(--aurora-accent-primary) 22%, transparent)",
  "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 45%, transparent)",
].join(", ")

const sizeClasses: Record<InputSize, string> = {
  sm: "h-7 px-2.5",
  default: "h-9 px-3",
  lg: "h-10 px-3.5",
}

const sizeFontTokens: Record<InputSize, string> = {
  sm: "var(--aurora-type-caption)",
  default: "var(--aurora-type-body-sm)",
  lg: "var(--aurora-type-control)",
}

function Input({
  ref,
  className,
  type = "text",
  startAdornment,
  endAdornment,
  style,
  state: stateProp,
  error,
  size = "default",
  clearable,
  onClear,
  value,
  defaultValue,
  onChange,
  unstyled = false,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
    // Hold a real ref to the underlying <input> so the clear button can drive the
    // actual DOM element (native value setter + dispatched "input" event) instead
    // of fabricating a detached element. Merge it with any forwarded ref via a
    // manual setRefs callback (no useImperativeHandle involved).
    //
    // NOTE: All hooks are declared unconditionally at the top of the component,
    // BEFORE the `unstyled` early-return, to satisfy the Rules of Hooks. The
    // unstyled bare <input> reuses the same `inputRef`/`setRefs` so the ref-merge
    // still exposes the underlying element to the forwarded ref in both modes.
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
      },
      [ref]
    )

    // Track internal value for clearable visibility when uncontrolled
    const [internalValue, setInternalValue] = React.useState<string>(
      typeof defaultValue === "string" || typeof defaultValue === "number"
        ? String(defaultValue)
        : ""
    )

    // Escape hatch: bare <input>, consumer CSS owns 100% of appearance. No wrapper,
    // no inline skin, no imperative focus handlers, no adornment/clear logic. The
    // bare <input> reuses `setRefs` so the forwarded ref still resolves to the real
    // DOM element. Skin props are ignored in this mode — warn (dev-only) if any were
    // passed so the silent drop is discoverable.
    if (unstyled) {
      if (process.env.NODE_ENV !== "production") {
        const ignored: string[] = []
        if (clearable) ignored.push("clearable")
        if (onClear) ignored.push("onClear")
        if (startAdornment !== undefined) ignored.push("startAdornment")
        if (endAdornment !== undefined) ignored.push("endAdornment")
        if (stateProp !== undefined) ignored.push("state")
        if (error !== undefined) ignored.push("error")
        if (size !== "default") ignored.push("size")
        if (ignored.length > 0) {
          devWarn(
            `[Aurora Input] \`unstyled\` is set, so skin props are ignored: ${ignored.join(", ")}. ` +
              `Remove them or drop \`unstyled\` to use the styled variant.`
          )
        }
      }
      return (
        <input
          ref={setRefs}
          type={type}
          className={className}
          style={style}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...props}
        />
      )
    }

    // Resolve effective state — explicit `state` wins over `error` shorthand
    const effectiveState: InputState | undefined = stateProp ?? (error ? "error" : undefined)
    const tokens = effectiveState ? STATE_TOKENS[effectiveState] : null

    // Determine whether the input currently has a value
    const isControlled = value !== undefined
    const currentValue = isControlled ? String(value ?? "") : internalValue
    const showClearButton = clearable && currentValue.length > 0

    // Build the effective end adornment — clear button takes precedence when visible
    const effectiveEndAdornment = showClearButton ? (
      <button
        type="button"
        aria-label="Clear value"
        className={cn(
          "pointer-events-auto",
          "flex h-4 w-4 items-center justify-center rounded-full",
          "text-[var(--aurora-text-muted)] hover:text-[var(--aurora-text-primary)]",
          "hover:bg-[var(--aurora-hover-bg)]",
          "transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aurora-focus-ring)]",
          "select-none"
        )}
        onMouseDown={(e) => {
          // Prevent input blur before we fire onChange
          e.preventDefault()
        }}
        onClick={() => {
          if (onClear) {
            onClear()
          } else if (onChange) {
            // Drive the REAL <input> element: set its value via the native setter
            // (bypassing React's value tracker) then dispatch a bubbling "input"
            // event so React's synthetic onChange fires with the genuine target.
            // This keeps form-library consumers (react-hook-form, Formik, etc.)
            // working, unlike fabricating a detached element as event.target.
            const el = inputRef.current
            if (el) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
              )?.set
              // Only dispatch the synthetic "input" event when the native setter
              // actually ran. If the descriptor/setter is missing, the value is
              // still stale — firing the event would deliver a misleading onChange
              // with the old value, so skip it.
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(el, "")
                el.dispatchEvent(new Event("input", { bubbles: true }))
              } else if (process.env.NODE_ENV !== "production") {
                devWarn(
                  "[Aurora Input] Could not resolve the native value setter; clear did not " +
                    "dispatch an input event. The onChange handler was not notified."
                )
              }
            }
          } else if (isControlled && process.env.NODE_ENV !== "production") {
            // Controlled input with neither onClear nor onChange: the clear button
            // cannot change the parent-owned value, so the click is inert.
            devWarn(
              "[Aurora Input] `clearable` clear button on a controlled input has no effect " +
                "without `onClear` or `onChange`. Provide one to handle the clear."
            )
          }
          // Always update internal state for uncontrolled
          if (!isControlled) {
            setInternalValue("")
          }
        }}
      >
        <X className="h-2.5 w-2.5" strokeWidth={1.8} aria-hidden="true" />
      </button>
    ) : endAdornment

    const hasStart = Boolean(startAdornment)
    const hasEnd = Boolean(effectiveEndAdornment)

    // Compute adornment padding — larger sizes need wider offsets
    const startPadClass =
      hasStart
        ? size === "sm"
          ? "pl-8"
          : size === "lg"
          ? "pl-10"
          : "pl-9"
        : undefined
    const endPadClass =
      hasEnd
        ? size === "sm"
          ? "pr-8"
          : size === "lg"
          ? "pr-10"
          : "pr-9"
        : undefined

    return (
      <div className="relative inline-flex w-full min-w-0 items-center">
        {hasStart && (
          <span
            className="pointer-events-none absolute left-3 z-10 flex items-center text-[var(--aurora-text-muted)]"
            aria-hidden="true"
          >
            {startAdornment}
          </span>
        )}

        <input
          ref={setRefs}
          type={type}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            // Layout — size-driven
            "w-full min-w-0 py-2",
            sizeClasses[size],
            // Typography
            "font-[var(--aurora-font-sans)]",
            "text-[var(--aurora-text-primary)]",
            "placeholder:text-[var(--aurora-text-muted)]",
            // Background & border
            "border",
            "border-[var(--aurora-border-strong)]",
            // Rounded
            "rounded-[var(--aurora-radius-1)]",
            // Transitions
            "transition-all duration-150 ease-out",
            // Focus ring — handled inline via onFocus/onBlur
            "focus-visible:outline-none",
            // Disabled
            "disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed",
            // Adornment padding adjustments
            startPadClass,
            endPadClass,
            className
          )}
          style={{
            background: "var(--aurora-control-surface)",
            fontSize: sizeFontTokens[size],
            fontWeight: "var(--aurora-weight-body)",
            letterSpacing: "var(--aurora-letter-ui)",
            lineHeight: "var(--aurora-line-ui)",
            // State border color — inline so it wins over Tailwind
            ...(tokens
              ? { borderColor: tokens.border }
              : {}),
            // Resting glow ring for validation state
            ...(tokens
              ? { boxShadow: stateRestShadow(tokens.ring) }
              : {}),
            ...style,
          }}
          onChange={(e) => {
            if (!isControlled) {
              setInternalValue(e.target.value)
            }
            onChange?.(e)
          }}
          onFocus={(e) => {
            if (tokens) {
              e.currentTarget.style.borderColor = tokens.border
              e.currentTarget.style.boxShadow = stateFocusShadow(tokens.ring)
            } else {
              e.currentTarget.style.borderColor = "var(--aurora-border-strong)"
              e.currentTarget.style.boxShadow = DEFAULT_FOCUS_SHADOW
            }
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            if (tokens) {
              // Restore resting state ring on blur
              e.currentTarget.style.borderColor = tokens.border
              e.currentTarget.style.boxShadow = stateRestShadow(tokens.ring)
            } else {
              e.currentTarget.style.boxShadow = "none"
            }
            props.onBlur?.(e)
          }}
          {...props}
        />

        {hasEnd && (
          <span
            className="pointer-events-auto absolute right-3 z-10 flex items-center text-[var(--aurora-text-muted)]"
          >
            {effectiveEndAdornment}
          </span>
        )}
      </div>
    )
}

export { Input }
export default Input
