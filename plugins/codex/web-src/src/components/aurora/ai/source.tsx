import * as React from "react"
import { ExternalLink, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/aurora/badge"
import { safeHttpUrl } from "@/lib/aurora/safe-url"

// ---------------------------------------------------------------------------
// Types (architecture source of truth — preserve the existing registry API)
// ---------------------------------------------------------------------------

export interface SourceItem {
  title: string
  href?: string
  description?: string
  badge?: string
}

export interface SourceProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Source descriptor rendered in the citation row. */
  source: SourceItem
  /** Optional 1-based ordinal rendered in the rose numbered chip. */
  index?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hostname(href?: string): string | null {
  if (!href) return null
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return href.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null
  }
}

// ---------------------------------------------------------------------------
// Source — standalone citation row: rose index chip, domain, badge, hover lit.
// Visual spec ported 1:1 from the Claude Design dsCard (control-surface card,
// rose numbered chip, bold title, neutral uppercase badge, globe + host,
// external-link arrow). Hover lifts the surface and border.
// ---------------------------------------------------------------------------

const Source = ({ ref, className, source, index, style, href, target, rel, tabIndex, ...props }: SourceProps & { ref?: React.Ref<HTMLAnchorElement> }) => {
    const safeHref = safeHttpUrl(href ?? source.href)
    const host = hostname(safeHref)
    const isLinked = Boolean(safeHref)

    return (
      <a
        ref={ref}
        {...props}
        href={safeHref}
        target={target ?? (isLinked ? "_blank" : undefined)}
        rel={rel ?? (isLinked ? "noreferrer noopener" : undefined)}
        tabIndex={tabIndex ?? (isLinked ? undefined : -1)}
        aria-disabled={isLinked ? undefined : true}
        aria-label={host ? `${source.title}, ${host}` : source.title}
        className={cn(
          "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-3.5 no-underline",
          "transition-[background,border-color,box-shadow,transform] duration-150 ease-out",
          "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)] focus-visible:ring-offset-0",
          isLinked &&
            "hover:-translate-y-px hover:border-[color:var(--aurora-border-strong)] hover:bg-[var(--aurora-hover-bg)]",
          className
        )}
        style={{
          background: "var(--aurora-control-surface)",
          border: "1px solid var(--aurora-border-default)",
          borderRadius: "calc(var(--aurora-radius-1) - 4px)",
          color: "var(--aurora-text-primary)",
          boxShadow: "var(--aurora-highlight-medium)",
          ...style,
        }}
      >
        {index != null ? (
          <span
            className="inline-flex size-7 shrink-0 items-center justify-center aurora-text-control"
            aria-hidden
            style={{
              borderRadius: "calc(var(--aurora-radius-1) - 6px)",
              background: "var(--aurora-accent-pink-surface)",
              border: "1px solid var(--aurora-accent-pink-border)",
              color: "var(--aurora-accent-pink-strong)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {index}
          </span>
        ) : (
          <span className="shrink-0" aria-hidden style={{ width: 0 }} />
        )}

        <span className="grid min-w-0 gap-1.5">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="truncate aurora-text-control"
              style={{ color: "var(--aurora-text-primary)", fontSize: 16, fontWeight: 700 }}
            >
              {source.title}
            </span>
            {source.badge ? (
              <Badge
                tone="neutral"
                fill="outline"
                className="shrink-0"
              >
                {source.badge}
              </Badge>
            ) : null}
          </span>
          {host ? (
            <span
              className="flex min-w-0 items-center gap-1.5 aurora-text-meta"
              style={{ color: "var(--aurora-text-muted)" }}
            >
              <Globe className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{host}</span>
            </span>
          ) : null}
          {source.description ? <span className="aurora-text-meta">{source.description}</span> : null}
        </span>

        {isLinked ? (
          <ExternalLink
            className="size-[18px] shrink-0 self-center text-[var(--aurora-text-muted)] transition-colors group-hover:text-[var(--aurora-accent-primary)]"
            aria-hidden
          />
        ) : (
          <span aria-hidden className="size-[18px] shrink-0" />
        )}
      </a>
    )
  }
Source.displayName = "Source"

export { Source }
export default Source
