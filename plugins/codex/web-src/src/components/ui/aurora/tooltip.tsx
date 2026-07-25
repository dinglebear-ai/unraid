import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"
import { usePortalContainer } from "@/lib/aurora/portal-container"

// ─── Provider ─────────────────────────────────────────────────────────────────

const TooltipProvider = TooltipPrimitive.Provider

// ─── Root ─────────────────────────────────────────────────────────────────────

const Tooltip = TooltipPrimitive.Root

// ─── Trigger ─────────────────────────────────────────────────────────────────

const TooltipTrigger = TooltipPrimitive.Trigger

// ─── Content ─────────────────────────────────────────────────────────────────

function TooltipContent({ ref, className, sideOffset = 6, style, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content> & { ref?: React.Ref<React.ComponentRef<typeof TooltipPrimitive.Content>> }) {
  const portalContainer = usePortalContainer()
  return (
    <TooltipPrimitive.Portal container={portalContainer ?? undefined}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-[260px] overflow-hidden rounded-[8px]",
          "border px-2.5 py-1.5",
          "text-xs font-medium leading-snug",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "duration-100",
          className
        )}
        style={{
          backgroundColor: "var(--aurora-panel-strong)",
          borderColor: "var(--aurora-border-strong)",
          color: "var(--aurora-text-primary)",
          boxShadow:
            "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
          fontSize: "12px",
          ...style,
        }}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
