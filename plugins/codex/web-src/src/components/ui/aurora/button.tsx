import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export type ButtonVariant =
  | "aurora"
  | "neutral"
  | "rose"
  | "success"
  | "warn"
  | "ghost"
  | "destructive"
  | "plain"

export type ButtonSize = "sm" | "default" | "lg" | "icon" | "unstyled"

// ─── cva (class selection + buttonVariants export) ─────────────────────────────

const buttonVariants = cva("aurora-btn", {
  variants: {
    variant: {
      aurora: "aurora-btn--aurora",
      neutral: "aurora-btn--neutral",
      rose: "aurora-btn--rose",
      success: "aurora-btn--success",
      warn: "aurora-btn--warn",
      ghost: "aurora-btn--ghost",
      destructive: "aurora-btn--destructive",
      plain: "aurora-btn--plain",
    },
    size: {
      sm: "aurora-btn--sm",
      default: "",
      lg: "aurora-btn--lg",
      icon: "aurora-btn--icon",
      unstyled: "aurora-btn--unstyled",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "default",
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Intent. `aurora` is the lit-outline cyan primary; rose is send/agent; warn is the clay-orange caution. */
  variant?: ButtonVariant
  size?: ButtonSize
  /** Slow glow pulse to draw attention without bouncing. Respects reduced-motion. */
  pulse?: boolean
  /** Flood the variant accent as a solid fill (the one hero/armed action per surface). Default false = lit-outline. */
  filled?: boolean
  /** Swap content for a spinner and block interaction. Width holds steady so the button doesn't jump. */
  loading?: boolean
  /** Stretch to fill the container width (forms, stacked CTAs, mobile). */
  block?: boolean
  /** Fully rounded pill shape (filter chips, compact toolbars). */
  shape?: "default" | "pill"
  /** Icon element rendered before the label (auto-sized to the text). */
  iconLeft?: React.ReactNode
  /** Icon element rendered after the label. */
  iconRight?: React.ReactNode
  /**
   * Render as the single child element (e.g. an `<a>`), merging Aurora classes
   * onto it via Radix `Slot` instead of emitting a `<button>`. Ignores the
   * `loading` spinner injection.
   */
  asChild?: boolean
}

function Button({
  ref,
  variant = "neutral",
  size = "default",
  pulse = false,
  filled = false,
  loading = false,
  block = false,
  shape = "default",
  iconLeft,
  iconRight,
  asChild = false,
  className,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  // Visual layer lives in registry/aurora/styles/aurora-components.css
  // (@layer components), shipped via the `aurora-components` registry item — no
  // runtime <style> injection.
  const isDisabled = disabled || loading

  const cls = cn(
    buttonVariants({ variant, size }),
    shape === "pill" && "aurora-btn--pill",
    pulse && !loading && "aurora-btn--pulse",
    filled && "aurora-btn--filled",
    block && "aurora-btn--block",
    loading && "aurora-btn--loading",
    // asChild renders a non-<button> (which ignores `disabled`), so emulate
    // the disabled visuals and drop it from the tab order via class + aria.
    asChild && isDisabled && "pointer-events-none opacity-45",
    className
  )

  // Guard clicks while disabled/loading. A native <button disabled> already
  // suppresses clicks, but asChild renders a non-button element that does not,
  // so swallow the event there (and defensively everywhere).
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      onClick?.(event)
    },
    [isDisabled, onClick]
  )

  // asChild: render the consumer's element via Slot, merging classes. No spinner.
  if (asChild) {
    return (
      <Slot
        ref={ref}
        className={cls}
        aria-busy={loading ? "true" : undefined}
        onClick={handleClick}
        // asChild renders a non-<button>, which ignores `disabled`; expose
        // disabled state to AT and drop it from the tab order instead.
        {...(isDisabled ? { "aria-disabled": true, tabIndex: -1 } : {})}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  const body = loading ? (
    <>
      <span className="aurora-btn__spinner" aria-hidden="true" />
      {size !== "icon" && children ? (
        <span style={{ opacity: 0 }}>{children}</span>
      ) : null}
    </>
  ) : (
    <>
      {iconLeft ? <span className="aurora-btn__icon">{iconLeft}</span> : null}
      {children}
      {iconRight ? <span className="aurora-btn__icon">{iconRight}</span> : null}
    </>
  )

  return (
    <button
      ref={ref}
      className={cls}
      disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      onClick={handleClick}
      {...props}
    >
      {body}
    </button>
  )
}

const MemoButton = React.memo(Button)
MemoButton.displayName = "Button"

export { MemoButton as Button, buttonVariants }
export default MemoButton
