"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePortalContainer } from "@/lib/aurora/portal-container"

// ─── Root ───────────────────────────────────────────────────────────────────

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

type SelectTone = "primary" | "neutral" | "orange"
type SelectToneStyle = React.CSSProperties & Record<`--aurora-select-${string}`, string>

const selectToneStyles: Record<SelectTone, SelectToneStyle> = {
  primary: {
    "--aurora-select-trigger-bg": "var(--aurora-control-surface)",
    "--aurora-select-trigger-border": "var(--aurora-border-strong)",
    "--aurora-select-focus-shadow": "0 0 0 3px var(--aurora-focus-ring), 0 0 0 1px var(--aurora-focus-ring-strong)",
    "--aurora-select-content-bg": "var(--aurora-panel-strong)",
    "--aurora-select-content-border": "var(--aurora-border-strong)",
    "--aurora-select-content-shadow": "var(--aurora-shadow-medium), 0 0 0 1px var(--aurora-accent-primary-border)",
    "--aurora-select-highlight-bg": "var(--aurora-hover-bg)",
    "--aurora-select-highlight-text": "var(--aurora-accent-strong)",
    "--aurora-select-selected-bg": "var(--aurora-selected-bg)",
    "--aurora-select-selected-text": "var(--aurora-accent-strong)",
    "--aurora-select-selected-border": "var(--aurora-accent-primary-border)",
    "--aurora-select-selected-shadow": "var(--aurora-active-glow)",
    "--aurora-select-indicator": "var(--aurora-accent-primary)",
  },
  neutral: {
    "--aurora-select-trigger-bg": "var(--aurora-panel-medium)",
    "--aurora-select-trigger-border": "var(--aurora-border-default)",
    "--aurora-select-focus-shadow": "0 0 0 3px var(--aurora-focus-ring), 0 0 0 1px var(--aurora-focus-ring-strong)",
    "--aurora-select-content-bg": "var(--aurora-panel-strong)",
    "--aurora-select-content-border": "var(--aurora-border-default)",
    "--aurora-select-content-shadow": "var(--aurora-shadow-medium)",
    "--aurora-select-highlight-bg": "var(--aurora-subtle-bg)",
    "--aurora-select-highlight-text": "var(--aurora-text-primary)",
    "--aurora-select-selected-bg": "var(--aurora-neutral-surface)",
    "--aurora-select-selected-text": "var(--aurora-neutral-foreground)",
    "--aurora-select-selected-border": "var(--aurora-neutral-border)",
    "--aurora-select-selected-shadow": "inset 0 1px 0 var(--aurora-panel-medium-top)",
    "--aurora-select-indicator": "var(--aurora-neutral-foreground)",
  },
  orange: {
    "--aurora-select-trigger-bg": "var(--aurora-panel-strong)",
    "--aurora-select-trigger-border": "var(--aurora-border-strong)",
    "--aurora-select-focus-shadow": "0 0 0 3px color-mix(in srgb, var(--axon-orange) 18%, transparent), 0 0 0 1px var(--axon-orange-border)",
    "--aurora-select-content-bg": "var(--aurora-panel-strong)",
    "--aurora-select-content-border": "var(--aurora-border-default)",
    "--aurora-select-content-shadow": "var(--aurora-shadow-strong)",
    "--aurora-select-highlight-bg": "var(--aurora-subtle-bg)",
    "--aurora-select-highlight-text": "var(--aurora-text-primary)",
    "--aurora-select-selected-bg": "var(--axon-orange-surface)",
    "--aurora-select-selected-text": "var(--axon-orange-deep)",
    "--aurora-select-selected-border": "var(--axon-orange-border)",
    "--aurora-select-selected-shadow": "inset 0 1px 0 var(--aurora-panel-medium-top)",
    "--aurora-select-indicator": "var(--axon-orange)",
  },
}

// ─── Trigger ─────────────────────────────────────────────────────────────────

function SelectTrigger({
  ref,
  className,
  children,
  tone = "primary",
  style,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Trigger>>
  tone?: SelectTone
}) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 px-3 py-2",
        "text-[var(--aurora-text-primary)]",
        "border border-[var(--aurora-border-strong)]",
        "rounded-[var(--aurora-radius-1)]",
        "transition-all duration-150 ease-out",
        "focus:outline-none",
        "disabled:pointer-events-none disabled:opacity-45",
        "data-[placeholder]:text-[var(--aurora-text-muted)]",
        "[&>span]:truncate",
        className
      )}
      style={{
        ...selectToneStyles[tone],
        background: "var(--aurora-select-trigger-bg)",
        borderColor: "var(--aurora-select-trigger-border)",
        fontFamily: "var(--aurora-font-sans)",
        fontSize: "var(--aurora-type-body-sm)",
        fontWeight: "var(--aurora-weight-ui)",
        letterSpacing: "var(--aurora-letter-ui)",
        lineHeight: "var(--aurora-line-ui)",
        ...style,
      }}
      onFocus={(event) => {
        event.currentTarget.style.boxShadow = "var(--aurora-select-focus-shadow)"
        onFocus?.(event)
      }}
      onBlur={(event) => {
        event.currentTarget.style.boxShadow = "none"
        onBlur?.(event)
      }}
      {...props}
      >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-[var(--aurora-text-muted)]" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// ─── Scroll buttons ───────────────────────────────────────────────────────────

function SelectScrollUpButton({ ref, className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton> & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>> }) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="h-4 w-4 text-[var(--aurora-text-muted)]" aria-hidden="true" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ ref, className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton> & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>> }) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4 text-[var(--aurora-text-muted)]" aria-hidden="true" />
    </SelectPrimitive.ScrollDownButton>
  )
}

// ─── Content (dropdown panel) ─────────────────────────────────────────────────

function SelectContent({
  ref,
  className,
  children,
  position = "popper",
  tone = "primary",
  style,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Content>>
  tone?: SelectTone
}) {
  const portalContainer = usePortalContainer()
  return (
    <SelectPrimitive.Portal container={portalContainer ?? undefined}>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 min-w-[8rem] overflow-hidden",
          "border border-[var(--aurora-border-strong)]",
          "rounded-[var(--aurora-radius-1)]",
          "text-[var(--aurora-text-primary)]",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" && [
            "data-[side=bottom]:translate-y-1",
            "data-[side=top]:-translate-y-1",
            "max-h-[var(--radix-select-content-available-height)]",
            "w-[var(--radix-select-trigger-width)]",
          ],
          className
        )}
        style={{
          ...selectToneStyles[tone],
          background: "var(--aurora-select-content-bg)",
          borderColor: "var(--aurora-select-content-border)",
          boxShadow: "var(--aurora-select-content-shadow)",
          ...style,
        }}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────

function SelectLabel({ ref, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label> & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Label>> }) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        "px-2 py-1.5",
        "text-[var(--aurora-text-muted)]",
        className
      )}
      style={{
        fontFamily: "var(--aurora-font-sans)",
        fontSize: "var(--aurora-type-label)",
        fontWeight: "var(--aurora-weight-label)",
        letterSpacing: "var(--aurora-letter-label)",
        lineHeight: "var(--aurora-line-dense)",
      }}
      {...props}
    />
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

function SelectItem({ ref, className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item> & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Item>> }) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center",
        "rounded-[10px] py-1.5 pl-2.5 pr-8",
        "border border-transparent",
        "outline-none transition-colors duration-100",
        "data-[highlighted]:bg-[var(--aurora-select-highlight-bg)] data-[highlighted]:text-[var(--aurora-select-highlight-text)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        "text-[var(--aurora-text-primary)]",
        "[&[data-state=checked]]:text-[var(--aurora-select-selected-text)]",
        "[&[data-state=checked]]:bg-[var(--aurora-select-selected-bg)]",
        "[&[data-state=checked]]:border-[var(--aurora-select-selected-border)]",
        "[&[data-state=checked]]:[box-shadow:var(--aurora-select-selected-shadow)]",
        className
      )}
      style={{
        fontFamily: "var(--aurora-font-sans)",
        fontSize: "var(--aurora-type-control)",
        fontWeight: "var(--aurora-weight-ui)",
        letterSpacing: "var(--aurora-letter-ui)",
        lineHeight: "var(--aurora-line-dense)",
      }}
      {...props}
    >
      <span className="absolute right-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-3.5 w-3.5 text-[var(--aurora-select-indicator)]" aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

// ─── Separator ────────────────────────────────────────────────────────────────

function SelectSeparator({ ref, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator> & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Separator>> }) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-[var(--aurora-border-default)]", className)}
      {...props}
    />
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

export default Select
