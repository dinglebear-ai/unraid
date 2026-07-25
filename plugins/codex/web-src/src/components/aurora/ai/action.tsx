import * as React from "react"
import { cn } from "@/lib/utils"

export interface ActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional visible label, rendered after the icon (icon + text variant). */
  label?: React.ReactNode
  /** Toggled / affirmative state — applies the rose-tinted styling + aria-pressed. */
  pressed?: boolean
  /** Size scale. */
  size?: "default" | "sm"
}

const Action = (
    { ref,
      className,
      children,
      label,
      pressed,
      size = "default",
      style,
      type = "button",
      ...props
    }: ActionProps & { ref?: React.Ref<HTMLButtonElement> }
  ) => {
    const hasLabel = label != null && label !== false
    const shape = hasLabel ? "text" : "icon"
    const sizeStyle: React.CSSProperties | undefined =
      size === "sm"
        ? hasLabel
          ? { height: 30, paddingInline: 6, borderRadius: 7 }
          : { width: 30, height: 30, borderRadius: 9 }
        : undefined

    return (
      <button
        ref={ref}
        type={type}
        data-shape={shape}
        data-size={size}
        data-has-label={hasLabel ? "true" : undefined}
        data-pressed={pressed ? "true" : undefined}
        aria-pressed={pressed != null ? pressed : undefined}
        className={cn("aurora-action", className)}
        style={{ ...sizeStyle, ...style }}
        {...props}
      >
        {children}
        {hasLabel ? <span className="aurora-action__label">{label}</span> : null}
      </button>
    )
  }
Action.displayName = "Action"

const MemoAction = React.memo(Action)
MemoAction.displayName = "Action"

export { MemoAction as Action }
export default MemoAction
