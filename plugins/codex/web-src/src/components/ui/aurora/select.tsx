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

// ─── Trigger ─────────────────────────────────────────────────────────────────

function SelectTrigger({ ref, className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger> & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Trigger>> }) {
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
        background: "var(--aurora-control-surface)",
        fontFamily: "var(--aurora-font-sans)",
        fontSize: "var(--aurora-type-body-sm)",
        fontWeight: "var(--aurora-weight-ui)",
        letterSpacing: "var(--aurora-letter-ui)",
        lineHeight: "var(--aurora-line-ui)",
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = [
          "0 0 0 3px color-mix(in srgb, var(--aurora-accent-primary) 22%, transparent)",
          "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 45%, transparent)",
        ].join(", ")
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none"
        props.onBlur?.(e)
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

function SelectContent({ ref, className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content> & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Content>> }) {
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
          background: "var(--aurora-panel-strong)",
          boxShadow: "var(--aurora-shadow-medium), 0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 8%, transparent)",
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
        "data-[highlighted]:bg-[var(--aurora-hover-bg)] data-[highlighted]:text-[var(--aurora-accent-strong)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        "text-[var(--aurora-text-primary)]",
        // Selected item — Aurora "selected glow"
        "[&[data-state=checked]]:text-[var(--aurora-accent-strong)]",
        "[&[data-state=checked]]:bg-[var(--aurora-selected-bg)]",
        "[&[data-state=checked]]:border-[color-mix(in_srgb,var(--aurora-accent-primary)_32%,transparent)]",
        "[&[data-state=checked]]:[box-shadow:var(--aurora-active-glow)]",
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
          <CheckIcon className="h-3.5 w-3.5 text-[var(--aurora-accent-primary)]" aria-hidden="true" />
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
