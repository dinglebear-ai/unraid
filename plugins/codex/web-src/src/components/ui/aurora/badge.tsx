import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Warn-once so repeated renders (and React strict-mode double-invokes) don't
// spam the console with the same deprecation notice.
const warned = new Set<string>()
function devWarn(message: string): void {
  if (process.env.NODE_ENV === "production") return
  if (warned.has(message)) return
  warned.add(message)
  console.warn(message)
}

// ---------------------------------------------------------------------------
// Tones
// ---------------------------------------------------------------------------
// CD parity: six tone families. `violet` was removed from the system; CD's
// expressive accents are cyan (primary), rose (secondary), and orange (warn).

export type BadgeTone =
  | "info"
  | "success"
  | "warn"
  | "error"
  | "neutral"
  | "rose"
  | "cyan"

/** Fill style — orthogonal to tone. CD parity: soft (default) / solid / outline. */
export type BadgeFill = "soft" | "solid" | "outline"

type ToneTokens = {
  /** Base accent — the saturated hue for dot, solid fill, outline border. */
  accent: string
  /** Soft-fill text color (light, legible on the tinted surface). */
  text: string
  /** Soft-fill border. */
  border: string
  /** Soft-fill tinted surface. */
  bg: string
  /** Text color used on a bright solid fill (dark, for contrast). */
  solidText: string
}

const badgeToneMap: Record<BadgeTone, ToneTokens> = {
  info: {
    accent:    "var(--aurora-info)",
    text:      "var(--aurora-info-foreground)",
    border:    "var(--aurora-info-border)",
    bg:        "var(--aurora-info-surface)",
    solidText: "var(--aurora-page-bg)",
  },
  success: {
    accent:    "var(--aurora-success)",
    text:      "var(--aurora-success-foreground)",
    border:    "var(--aurora-success-border)",
    bg:        "var(--aurora-success-surface)",
    solidText: "var(--aurora-page-bg)",
  },
  warn: {
    accent:    "var(--aurora-warn)",
    text:      "var(--aurora-warn-foreground)",
    border:    "var(--aurora-warn-border)",
    bg:        "var(--aurora-warn-surface)",
    solidText: "var(--aurora-page-bg)",
  },
  error: {
    accent:    "var(--aurora-error)",
    text:      "var(--aurora-error-foreground)",
    border:    "var(--aurora-error-border)",
    bg:        "var(--aurora-error-surface)",
    solidText: "var(--aurora-page-bg)",
  },
  neutral: {
    accent:    "var(--aurora-neutral)",
    text:      "var(--aurora-neutral-foreground)",
    border:    "var(--aurora-neutral-border)",
    bg:        "var(--aurora-neutral-surface)",
    solidText: "var(--aurora-page-bg)",
  },
  rose: {
    accent:    "var(--aurora-accent-pink)",
    text:      "var(--aurora-accent-pink-foreground)",
    border:    "var(--aurora-accent-pink-border)",
    bg:        "var(--aurora-accent-pink-surface)",
    solidText: "var(--aurora-page-bg)",
  },
  // Consumes the same token family as every other tone, so the cyan badge
  // tracks the theme (light mode included) instead of hand-mixing colors.
  cyan: {
    accent:    "var(--aurora-accent-primary)",
    text:      "var(--aurora-accent-primary-foreground)",
    border:    "var(--aurora-accent-primary-border)",
    bg:        "var(--aurora-accent-primary-surface)",
    solidText: "var(--aurora-page-bg)",
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FILL_VALUES = new Set<BadgeFill>(["soft", "solid", "outline"])

function isFillValue(v: string): v is BadgeFill {
  return FILL_VALUES.has(v as BadgeFill)
}

function resolveTone(value: BadgeTone | "default" | "violet" | undefined): BadgeTone {
  if (!value) return "neutral"
  if (value === "default") {
    devWarn('[Aurora Badge] tone="default" is deprecated. Use tone="neutral" instead.')
    return "neutral"
  }
  if (value === "violet") {
    devWarn('[Aurora Badge] tone="violet" was removed. Falling back to "cyan".')
    return "cyan"
  }
  if (!Object.hasOwn(badgeToneMap, value)) {
    devWarn(
      `[Aurora Badge] Unknown tone "${value}". Valid values: ${Object.keys(badgeToneMap).join(", ")}. Falling back to "neutral".`
    )
    return "neutral"
  }
  return value
}

/** Resolve a trusted React icon slot. */
function resolveIcon(
  icon: React.ReactNode | undefined,
  _isSm: boolean,
  _slot: "icon" | "iconTrailing"
): React.ReactNode {
  return icon ?? null
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Color family OR fill style. Accepts a tone ("info" | "success" | "warn" |
   * "error" | "neutral" | "rose" | "cyan") for backward compatibility, or a
   * fill keyword ("soft" | "solid" | "outline"). "default"/"violet" are
   * deprecated tone aliases (→ neutral / cyan). Prefer the explicit `tone` and
   * `fill` props.
   */
  variant?: BadgeTone | BadgeFill | "default" | "violet"
  /** Color family. <Badge tone="success"> */
  tone?: BadgeTone | "default" | "violet"
  /** Fill style: "soft" (default, tinted) | "solid" (bright) | "outline" (transparent). */
  fill?: BadgeFill
  /** Render a status dot to the left of the label. */
  dot?: boolean
  /**
   * Leading icon. Pass a trusted React node such as a lucide-react icon.
   */
  icon?: React.ReactNode
  /**
   * Trailing icon, rendered after the label (before any remove button). Same
   * string/node contract as `icon`.
   */
  iconTrailing?: React.ReactNode
  /**
   * Make the badge dismissible: renders a trailing "×" button. The handler
   * receives the button click; propagation to the badge's own `onClick` is
   * stopped automatically.
   */
  onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void
  /** Accessible label for the remove button. Defaults to "Remove". */
  removeLabel?: string
  /**
   * Numeric notification count. Renders the number as the badge content (when
   * no children are given), capped at `max` (→ "{max}+"). Hidden at 0 unless
   * `showZero`.
   */
  count?: number
  /** Overflow cap for `count`. Values above render as "{max}+". Defaults to 99. */
  max?: number
  /** Render the count badge even when `count` is 0. Defaults to false. */
  showZero?: boolean
  /**
   * Absolutely position the badge at the top-right corner of a
   * `position: relative` parent — the classic notification bubble on an icon
   * or avatar.
   */
  anchored?: boolean
  /**
   * Animate the dot with a pulse ring — use for "live", "recording", or
   * "connected" indicators. Has no effect when `dot` is false.
   */
  pulse?: boolean
  /** Visual size. "sm" | "md" (alias "default"). Defaults to "md". */
  size?: "sm" | "md" | "default"
  /**
   * Typography and radius shape:
   * - "label"  (default) — uppercase mono, 4px radius. Status codes, tech labels.
   * - "tag"    — sentence-case sans, 4px radius. Content tags, user labels.
   * - "pill"   — sentence-case sans, 999px radius. Fully rounded chips.
   */
  shape?: "label" | "tag" | "pill"
  /**
   * Render as a clickable chip (filter tags, toggleable labels).
   * Adds cursor-pointer, focus ring, and keyboard activation (Enter/Space).
   * When `onClick` is also provided, `role="button"` is applied automatically.
   */
  interactive?: boolean
  /**
   * Toggle state for an interactive chip. Drives `aria-pressed` and a selected
   * emphasis ring. Leave undefined for non-toggle chips.
   */
  selected?: boolean
  /** Disable an interactive chip — suppresses activation, removal, and focus. */
  disabled?: boolean
  /**
   * Render the consumer's own element (e.g. an `<a>`) via Radix `Slot` instead
   * of a `<span>`, so a navigational chip is a real link. Decorations (dot,
   * icons, remove button) wrap around the slotted child.
   */
  asChild?: boolean
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

function Badge({
  ref,
  className,
  variant,
  tone: toneProp,
  fill: fillProp,
  dot = false,
  icon,
  iconTrailing,
  onRemove,
  removeLabel = "Remove",
  count,
  max = 99,
  showZero = false,
  anchored = false,
  pulse = false,
  size = "md",
  shape = "label",
  interactive = false,
  selected,
  disabled = false,
  asChild = false,
  style,
  children,
  onClick,
  onKeyDown,
  ...props
}: BadgeProps & { ref?: React.Ref<HTMLSpanElement> }) {
  // `variant` is overloaded for backward/CD compat: it may carry either a
  // fill keyword or a tone. Split it into the two orthogonal axes.
  const variantFill = variant && isFillValue(variant) ? (variant as BadgeFill) : undefined
  const variantTone =
    variant && !isFillValue(variant)
      ? (variant as BadgeTone | "default" | "violet")
      : undefined

  const tone = resolveTone(toneProp ?? variantTone)
  const fill: BadgeFill = fillProp ?? variantFill ?? "soft"
  const { accent, text, border, bg, solidText } = badgeToneMap[tone]

  // -----------------------------------------------------------------------
  // Count resolution
  // -----------------------------------------------------------------------
  const hasCount = typeof count === "number"
  const countText = hasCount ? (count! > max ? `${max}+` : String(count)) : null
  // Notification convention: a 0 count renders nothing unless asked. The actual
  // `return null` happens after all hooks run (rules-of-hooks), see below.
  const hiddenByZero = hasCount && count === 0 && !showZero
  const isCount = countText !== null && children == null

  // -----------------------------------------------------------------------
  // Size tokens
  // -----------------------------------------------------------------------
  const isSm = size === "sm"
  const dotSize = isSm ? "4px" : "5px"
  const badgeRadius = shape === "pill" || isCount ? "999px" : "4px"
  const badgeFontSize = isSm
    ? "var(--aurora-type-caption)"
    : "var(--aurora-type-micro)"

  // -----------------------------------------------------------------------
  // Shape tokens
  // -----------------------------------------------------------------------
  const isLabel = shape === "label" && !isCount
  const fontFamily = isLabel
    ? "var(--aurora-font-mono, 'JetBrains Mono', monospace)"
    : "var(--aurora-font-sans, Inter, sans-serif)"
  const letterSpacing = isLabel ? "0.075em" : "0.01em"

  // -----------------------------------------------------------------------
  // Fill resolution (soft / solid / outline)
  // -----------------------------------------------------------------------
  const dotColor = fill === "solid" ? solidText : accent
  const dotShadow =
    fill === "solid"
      ? "0 0 4px color-mix(in srgb, var(--badge-dot-color) 60%, transparent)"
      : "0 0 4px var(--badge-dot-color)"

  let fillStyle: React.CSSProperties
  if (fill === "solid") {
    fillStyle = {
      background: accent,
      borderColor: "transparent",
      color: solidText,
      // Subtle outer glow so the bright chip reads as "live" against the navy.
      boxShadow: `0 2px 10px color-mix(in srgb, ${accent} 32%, transparent)`,
    }
  } else if (fill === "outline") {
    fillStyle = {
      background: "transparent",
      borderColor: border,
      color: text,
    }
  } else {
    // soft (default)
    fillStyle = {
      background: bg,
      borderColor: border,
      color: text,
    }
  }

  // -----------------------------------------------------------------------
  // Icon / content resolution
  // -----------------------------------------------------------------------
  const leadingIcon = resolveIcon(icon, isSm, "icon")
  const trailingIcon = resolveIcon(iconTrailing, isSm, "iconTrailing")
  const content = children ?? countText

  // -----------------------------------------------------------------------
  // Interaction
  // -----------------------------------------------------------------------
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (disabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
    },
    [disabled, onClick]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      onKeyDown?.(e)
      if (disabled) return
      if (interactive && onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        onClick(e as unknown as React.MouseEvent<HTMLSpanElement>)
      }
    },
    [interactive, disabled, onClick, onKeyDown]
  )

  const handleRemove = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Never let dismissal bubble into the chip's own click/toggle.
      e.stopPropagation()
      if (disabled) return
      onRemove?.(e)
    },
    [disabled, onRemove]
  )

  // Safe now that every hook above has run unconditionally.
  if (hiddenByZero) return null

  // Behavior/ARIA props applied to the badge element itself. Native keyboard,
  // role, and tabIndex are skipped under `asChild` — the consumer's element
  // (e.g. an <a>) provides them — but pressed/disabled semantics still merge.
  const behaviorProps: React.HTMLAttributes<HTMLSpanElement> & {
    tabIndex?: number
    role?: "button"
    "aria-pressed"?: boolean
    "aria-disabled"?: boolean
  } = {}
  if (interactive) {
    if (!asChild) {
      behaviorProps.tabIndex = disabled ? -1 : 0
      if (onClick) behaviorProps.role = "button"
      behaviorProps.onKeyDown = handleKeyDown
    }
    if (typeof selected === "boolean") behaviorProps["aria-pressed"] = selected
    if (disabled) behaviorProps["aria-disabled"] = true
  }
  if (onClick) behaviorProps.onClick = handleClick

  // -----------------------------------------------------------------------
  // Remove button
  // -----------------------------------------------------------------------
  const removeNode = onRemove ? (
    <button
      type="button"
      aria-label={removeLabel}
      onClick={handleRemove}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "-mr-0.5 inline-flex items-center justify-center rounded-[3px] opacity-70",
        "transition-opacity hover:opacity-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)]"
      )}
      style={{
        color: "currentColor",
        background: "transparent",
        border: 0,
        cursor: disabled ? "default" : "pointer",
        lineHeight: 0,
        padding: 0,
      }}
    >
      <X size={isSm ? 11 : 12} aria-hidden="true" />
    </button>
  ) : null

  // -----------------------------------------------------------------------
  // Assembly
  // -----------------------------------------------------------------------
  const Comp: React.ElementType = asChild ? Slot : "span"

  const inner = (
    <>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(pulse && "aurora-badge-dot--pulse")}
          style={{
            display: "inline-block",
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: dotColor,
            flexShrink: 0,
            // Static glow when not pulsing; the keyframe (in aurora.css)
            // handles it when pulsing.
            boxShadow: pulse ? undefined : dotShadow,
            // Consumed by the pulse keyframe so one CSS rule spans all tones.
            ["--badge-dot-color" as string]: dotColor,
          }}
        />
      )}
      {leadingIcon}
      {asChild ? <Slottable>{content}</Slottable> : content}
      {trailingIcon}
      {removeNode}
    </>
  )

  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 leading-none border whitespace-nowrap",
        // Size
        isSm ? "px-1.5 py-0" : "px-2 py-0.5",
        // Count bubbles read best centered with tight symmetric padding.
        isCount && (isSm ? "px-1" : "px-1.5"),
        // Shape: uppercase only for a plain "label"
        isLabel && "uppercase",
        // Interactive
        interactive && [
          "cursor-pointer",
          "transition-[box-shadow,filter,transform] duration-150",
          "hover:brightness-125",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)]",
        ],
        // Selected (toggle) emphasis
        interactive && selected && "ring-2 ring-[var(--aurora-focus-ring)]",
        // Disabled
        disabled && "cursor-default opacity-45",
        className
      )}
      style={{
        borderRadius: badgeRadius,
        fontFamily,
        fontSize: badgeFontSize,
        fontWeight: 650,
        letterSpacing,
        ...(isCount
          ? {
              justifyContent: "center",
              minWidth: isSm ? "16px" : "18px",
              fontVariantNumeric: "tabular-nums",
            }
          : null),
        ...(anchored
          ? {
              position: "absolute",
              top: 0,
              right: 0,
              transform: "translate(50%, -50%)",
            }
          : null),
        ...fillStyle,
        ...style,
      }}
      {...behaviorProps}
      {...props}
    >
      {inner}
    </Comp>
  )
}

export { Badge }
export default Badge

/** @deprecated badgeVariants has been removed. Use the Badge component directly. */
export const badgeVariants = undefined
