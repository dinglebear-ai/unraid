"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePortalContainer } from "@/lib/aurora/portal-container"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

type SheetSide = "left" | "right" | "top" | "bottom"

export interface SheetContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  side?: SheetSide
  hideClose?: boolean
}

const sideClass: Record<SheetSide, string> = {
  left: "left-0 top-0 h-full w-[min(396px,92vw)] data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  right: "right-0 top-0 h-full w-[min(396px,92vw)] data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  top: "left-0 top-0 h-[min(360px,80vh)] w-full data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
  bottom: "bottom-0 left-0 h-[min(420px,82vh)] w-full data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
}

function SheetContent({ ref, className, children, side = "right", style, hideClose = false, ...props }: SheetContentProps & { ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Content>> }) {
  // Portal into a scoped container when one is provided (e.g. a scaled catalog
  // preview tile) so the overlay stays contained instead of escaping to body.
  const portalContainer = usePortalContainer()
  return (
    <SheetPortal container={portalContainer ?? undefined}>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        style={{ backgroundColor: "var(--aurora-overlay)" }}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden border transition ease-in-out focus-visible:outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          sideClass[side],
          className,
        )}
        style={{
          background: "var(--aurora-panel-strong)",
          borderColor: "var(--aurora-border-strong)",
          boxShadow: "0 28px 72px rgba(0,0,0,0.42), var(--aurora-highlight-strong)",
          color: "var(--aurora-text-primary)",
          ...style,
        }}
        {...props}
      >
        {children}
        {!hideClose ? (
          <SheetClose
            className="absolute right-5 top-5 rounded-full border p-1.5 text-[var(--aurora-text-muted)] transition-colors hover:text-[var(--aurora-text-primary)] focus-visible:outline-none focus-visible:ring-2 [&:focus-visible]:ring-[var(--aurora-focus-ring)]"
            style={{
              borderColor: "var(--aurora-border-default)",
              background: "var(--aurora-control-surface)",
            }}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </SheetClose>
        ) : null}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("border-b px-6 py-5 pr-16", className)} style={{ borderColor: "var(--aurora-border-default)" }} {...props} />
  )
}

function SheetBody({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-5", className)} {...props} />
  )
}

function SheetFooter({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("border-t px-6 py-4", className)} style={{ borderColor: "var(--aurora-border-default)" }} {...props} />
  )
}

function SheetTitle({ ref, style, ...props }: React.ComponentProps<typeof DialogPrimitive.Title> & { ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Title>> }) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      style={{ color: "var(--aurora-text-primary)", ...style }}
      {...props}
    />
  )
}

function SheetDescription({ ref, style, ...props }: React.ComponentProps<typeof DialogPrimitive.Description> & { ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Description>> }) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      style={{ color: "var(--aurora-text-muted)", ...style }}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription }
