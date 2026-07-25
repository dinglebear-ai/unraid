"use client"

import * as React from "react"
import { safeHttpUrl } from "@/lib/aurora/safe-url"

export interface InlineCitationProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 1-based citation number rendered inside the chip. */
  index: number
  /** Source title shown in the hover/focus preview popover. */
  title?: string
  /** Optional context line shown below the title. */
  description?: string
  /** Source URL shown in the hover/focus preview popover. */
  url?: string
}

/**
 * InlineCitation — a compact rose citation chip rendered inline with body text.
 * When `title`/`url` are supplied it reveals a source preview on hover and
 * keyboard focus; otherwise it renders as a plain numbered chip.
 */
const InlineCitation = (
    { ref,
      className,
      index,
      title,
      description,
      url,
      style,
      children,
      href,
      target,
      rel,
      tabIndex,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...props
    }: InlineCitationProps & { ref?: React.Ref<HTMLAnchorElement> }
  ) => {
    const [open, setOpen] = React.useState(false)
    const resolvedHref = safeHttpUrl(href ?? url)
    const hasPreview = Boolean(title || description || url)
    const previewId = React.useId()
    const resolvedTarget = target ?? (resolvedHref ? "_blank" : undefined)
    const resolvedRel = rel ?? (resolvedHref ? "noreferrer noopener" : undefined)

    const handleMouseEnter = React.useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (hasPreview) setOpen(true)
        onMouseEnter?.(event)
      },
      [hasPreview, onMouseEnter]
    )
    const handleMouseLeave = React.useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (hasPreview) setOpen(false)
        onMouseLeave?.(event)
      },
      [hasPreview, onMouseLeave]
    )
    const handleFocus = React.useCallback(
      (event: React.FocusEvent<HTMLAnchorElement>) => {
        if (hasPreview) setOpen(true)
        onFocus?.(event)
      },
      [hasPreview, onFocus]
    )
    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLAnchorElement>) => {
        if (hasPreview) setOpen(false)
        onBlur?.(event)
      },
      [hasPreview, onBlur]
    )

    const chip = (
      <a
        ref={ref}
        className={[
          "inline-flex items-center justify-center rounded-[5px] border align-baseline no-underline",
          "border-[color:var(--aurora-citation-border)] bg-[var(--aurora-citation-bg)] transition-colors",
          "hover:border-[color:var(--aurora-citation-border-hover)] hover:bg-[var(--aurora-citation-bg-hover)]",
          "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-citation-ring)] focus-visible:ring-offset-0",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        href={resolvedHref}
        target={resolvedTarget}
        rel={resolvedRel}
        tabIndex={tabIndex ?? (hasPreview && !resolvedHref ? 0 : undefined)}
        aria-label={title ? `Citation ${index}: ${title}` : `Citation ${index}`}
        aria-describedby={hasPreview && open ? previewId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          minWidth: "1.05rem",
          padding: "1px 5px",
          ["--aurora-citation-bg" as string]:
            "color-mix(in srgb, var(--aurora-accent-pink) 12%, transparent)",
          ["--aurora-citation-bg-hover" as string]:
            "color-mix(in srgb, var(--aurora-accent-pink) 20%, transparent)",
          ["--aurora-citation-border" as string]:
            "color-mix(in srgb, var(--aurora-accent-pink) 32%, transparent)",
          ["--aurora-citation-border-hover" as string]:
            "color-mix(in srgb, var(--aurora-accent-pink) 48%, transparent)",
          ["--aurora-citation-ring" as string]:
            "color-mix(in srgb, var(--aurora-accent-pink) 45%, transparent)",
          color: "var(--aurora-accent-pink)",
          fontFamily: "var(--aurora-font-mono)",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.45,
          ...style,
        }}
        {...props}
      >
        {children ?? index}
      </a>
    )

    if (!hasPreview) return chip

    return (
      <span
        className="relative inline-block align-baseline"
        style={{ lineHeight: 0 }}
      >
        {chip}
        <span
          id={previewId}
          role="tooltip"
          hidden={!open}
          className="absolute left-1/2 z-50 grid gap-1"
          style={{
            bottom: "calc(100% + 8px)",
            transform: "translateX(-50%)",
            width: "max-content",
            maxWidth: 260,
            padding: "10px 12px",
            background: "var(--aurora-surface-raised)",
            border: "1px solid var(--aurora-border-strong)",
            borderRadius: "var(--aurora-radius-1)",
            boxShadow:
              "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
          }}
        >
          {title ? (
            <span
              className="aurora-text-control"
              style={{
                lineHeight: 1.35,
                color: "var(--aurora-text-primary)",
              }}
            >
              {title}
            </span>
          ) : null}
          {description ? (
            <span className="aurora-text-body-sm" style={{ color: "var(--aurora-text-muted)" }}>
              {description}
            </span>
          ) : null}
          {url ? (
            <span
              className="aurora-text-meta"
              style={{
                lineHeight: 1.4,
                color: "var(--aurora-accent-pink)",
                wordBreak: "break-all",
              }}
            >
              {url}
            </span>
          ) : null}
        </span>
      </span>
    )
  }
InlineCitation.displayName = "InlineCitation"

export { InlineCitation }
