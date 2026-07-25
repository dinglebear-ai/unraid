import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const CollapsibleRoot = CollapsiblePrimitive.Root

function CollapsibleTrigger({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      className={cn(
        "group flex w-full items-center gap-3 px-5 py-3.5 text-left outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-inset",
        className
      )}
      style={{
        color: "var(--aurora-text-primary)",
        fontFamily: "var(--aurora-font-display)",
        fontSize: "15px",
        fontWeight: "var(--aurora-weight-heading)",
        ...style,
      }}
      {...props}
    >
      <ChevronRight
        className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90"
        strokeWidth={2}
        aria-hidden
        style={{ color: "var(--aurora-text-muted)" }}
      />
      <span className="truncate">{children}</span>
    </CollapsiblePrimitive.CollapsibleTrigger>
  )
}

function CollapsibleContent({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden border-t data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      style={{ borderColor: "var(--aurora-border-default)" }}
      {...props}
    >
      <div
        className="px-5 pb-4 pt-3"
        style={{
          color: "var(--aurora-text-muted)",
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "var(--aurora-type-body)",
          lineHeight: 1.55,
          ...style,
        }}
      >
        {children}
      </div>
    </CollapsiblePrimitive.CollapsibleContent>
  )
}

export interface CollapsibleProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>,
    "children" | "title"
  > {
  title: React.ReactNode
  children: React.ReactNode
  triggerClassName?: string
  contentClassName?: string
  ref?: React.Ref<React.ComponentRef<typeof CollapsiblePrimitive.Root>>
}

function Collapsible({
  ref,
  className,
  title,
  children,
  triggerClassName,
  contentClassName,
  style,
  ...props
}: CollapsibleProps) {
  return (
    <CollapsibleRoot
      ref={ref}
      data-slot="collapsible"
      className={cn("overflow-hidden rounded-[12px] border", className)}
      style={{
        background: "var(--aurora-panel-medium)",
        borderColor: "var(--aurora-border-default)",
        ...style,
      }}
      {...props}
    >
      <CollapsibleTrigger className={triggerClassName}>{title}</CollapsibleTrigger>
      <CollapsibleContent className={contentClassName}>{children}</CollapsibleContent>
    </CollapsibleRoot>
  )
}

export { Collapsible, CollapsibleContent, CollapsibleRoot, CollapsibleTrigger }
export default Collapsible
