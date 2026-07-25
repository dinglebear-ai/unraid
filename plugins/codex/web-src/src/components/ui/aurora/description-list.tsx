import * as React from "react"
import { cn } from "@/lib/utils"

function DescriptionList({ ref, className, ...props }: React.HTMLAttributes<HTMLDListElement> & { ref?: React.Ref<HTMLDListElement> }) {
  return (
    <dl
      ref={ref}
      className={cn("grid gap-0 overflow-hidden rounded-[var(--aurora-radius-1)] border", className)}
      style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-panel-medium)" }}
      {...props}
    />
  )
}

export interface DescriptionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode
  value: React.ReactNode
  /** Highlight the row with a cyan-tinted surface (active/selected state). */
  active?: boolean
}

function DescriptionItem({ ref, className, label, value, active = false, ...props }: DescriptionItemProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn("grid grid-cols-1 gap-3 border-b px-7 py-[14px] last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4", className)}
      style={{
        borderColor: "var(--aurora-border-default)",
        background: active ? "var(--aurora-selected-bg)" : undefined,
      }}
      {...props}
    >
      <dt
        className="flex items-center gap-2.5"
        style={{
          color: "var(--aurora-text-muted)",
          fontSize: "var(--aurora-type-label)",
          fontWeight: "var(--aurora-weight-label)",
          letterSpacing: "var(--aurora-letter-label)",
          lineHeight: "var(--aurora-line-dense)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "3px",
            height: "14px",
            flexShrink: 0,
            borderRadius: "9999px",
            background: "var(--aurora-accent-primary)",
          }}
        />
        {label}
      </dt>
      <dd
        style={{
          color: "var(--aurora-text-primary)",
          fontSize: "var(--aurora-type-table)",
          fontWeight: "var(--aurora-weight-body)",
          lineHeight: 1.42,
          margin: 0,
          minWidth: 0,
        }}
      >
        {value}
      </dd>
    </div>
  )
}

export { DescriptionList, DescriptionItem }
