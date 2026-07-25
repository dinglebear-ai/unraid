"use client"

import * as React from "react"
import { ChevronDown, FileText } from "lucide-react"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"
import { Source, type SourceItem, type SourceProps } from "@/components/aurora/ai/source"

// ---------------------------------------------------------------------------
// Types (architecture source of truth — keep the existing registry API)
// ---------------------------------------------------------------------------

export interface SourcesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
  /** Render the count badge + chevron and allow the body to collapse. */
  collapsible?: boolean
  /** Control the collapsed state (uncontrolled defaults to expanded). */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export type { SourceItem, SourceProps }

// ---------------------------------------------------------------------------
// Shared surface helpers (ported from CD injected CSS)
// ---------------------------------------------------------------------------

function panelStyle(style?: React.CSSProperties): React.CSSProperties {
  return {
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-strong)",
    borderRadius: "var(--aurora-radius-1)",
    boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
    ...style,
  }
}


// ---------------------------------------------------------------------------
// Count badge — small neutral pill next to the title
// ---------------------------------------------------------------------------

function CountBadge({ count }: { count: number }) {
  return (
    <Badge
      tone="neutral"
      fill="outline"
      className="min-w-[22px] justify-center px-1.5 tabular-nums"
    >
      {count}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Sources — bordered panel with file icon, title, count badge, collapsible body
// ---------------------------------------------------------------------------

const Sources = (
    { ref,
      className,
      title = "Sources",
      collapsible = false,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      style,
      children,
      ...props
    }: SourcesProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const isControlled = openProp !== undefined
    const [openState, setOpenState] = React.useState(defaultOpen)
    const open = isControlled ? openProp : openState

    const count = React.Children.toArray(children).filter(React.isValidElement).length

    const toggle = React.useCallback(() => {
      const next = !open
      if (!isControlled) setOpenState(next)
      onOpenChange?.(next)
    }, [open, isControlled, onOpenChange])

    const headerInner = (
      <>
        <FileText className="size-[18px] shrink-0" aria-hidden style={{ color: "var(--aurora-accent-pink)" }} />
        <span
          className="aurora-text-label"
          style={{ color: "var(--aurora-text-primary)", fontSize: 16, fontWeight: 700 }}
        >
          {title}
        </span>
        {collapsible ? <CountBadge count={count} /> : null}
        {collapsible ? (
          <ChevronDown
            className="ml-auto size-[18px] shrink-0 transition-transform"
            aria-hidden
            style={{
              color: "var(--aurora-text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        ) : null}
      </>
    )

    return (
      <div
        ref={ref}
        className={["grid gap-3 p-4", className].filter(Boolean).join(" ")}
        style={panelStyle(style)}
        {...props}
      >
        {collapsible ? (
          <Button
            type="button"
            variant="plain"
            size="unstyled"
            onClick={toggle}
            aria-expanded={open}
            className="flex items-center gap-2.5 bg-transparent p-0 text-left outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-offset-0"
            style={{ borderRadius: "var(--aurora-radius-1)", cursor: "pointer", color: "inherit" }}
          >
            {headerInner}
          </Button>
        ) : (
          <div className="flex items-center gap-2.5">{headerInner}</div>
        )}
        {!collapsible || open ? <div className="grid gap-2.5">{children}</div> : null}
      </div>
    )
  }
Sources.displayName = "Sources"

export { Source, Sources }
