import * as React from "react"
import { Check, GitBranch, GitCommitHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClipboard } from "@/lib/aurora/use-clipboard"

export type CommitVariant = "default" | "compact"

export interface CommitProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short commit hash, e.g. `ca8cb38`. */
  hash: string
  /** Commit subject line. */
  message: string
  /** Author handle; first letter seeds the avatar. */
  author?: string
  /** Relative timestamp, e.g. `4m ago`. */
  time?: string
  /** Branch name shown in the diffstat row. */
  branch?: string
  /** Files touched. */
  files?: number
  /** Lines added. */
  additions?: number
  /** Lines removed. */
  deletions?: number
  /** Render the AI authorship badge next to the subject. */
  badge?: boolean
  /** Density. `compact` collapses to a single row (avatar · message · hash). */
  variant?: CommitVariant
}

// ── Aurora token panel surface (mirrors the elements panelStyle) ───────────────
function commitPanelStyle(style?: React.CSSProperties): React.CSSProperties {
  return {
    background: "var(--aurora-surface-raised)",
    border: "1px solid var(--aurora-border-strong)",
    borderRadius: "var(--aurora-radius-1)",
    boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
    ...style,
  }
}

function CommitAvatar({ seed, size }: { seed: string; size: number }) {
  const initial = (seed.trim()[0] ?? "?").toUpperCase()
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        color: "var(--aurora-accent-primary)",
        border: "1.5px solid color-mix(in srgb, var(--aurora-accent-primary) 60%, transparent)",
        background: "color-mix(in srgb, var(--aurora-accent-primary) 12%, transparent)",
        fontFamily: "var(--aurora-font-display)",
        fontWeight: 700,
        fontSize: size * 0.4,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  )
}

function HashChip({ hash }: { hash: string }) {
  const { copied, error, copy } = useClipboard(1200)
  const handleCopy = React.useCallback(() => void copy(hash), [copy, hash])

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `Copied ${hash}` : error ? `Unable to copy ${hash}` : `Copy commit ${hash}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1 transition-colors"
      style={{
        border: "1px solid var(--aurora-border-default)",
        background: "var(--aurora-control-surface)",
        color: copied ? "var(--aurora-success)" : "var(--aurora-text-muted)",
      }}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <GitCommitHorizontal className="size-3.5" aria-hidden style={{ opacity: 0.85 }} />
      )}
      <span className="aurora-text-meta" style={{ color: "currentColor", fontVariantNumeric: "tabular-nums" }}>
        {hash}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {copied ? "Copied" : error ? "Unable to copy" : ""}
      </span>
    </button>
  )
}

const Commit = React.memo(
  function Commit(
    { ref,
      hash,
      message,
      author,
      time,
      branch,
      files,
      additions,
      deletions,
      badge = false,
      variant = "default",
      className,
      style,
      ...props
    }: CommitProps & { ref?: React.Ref<HTMLDivElement> },
  ) {
    const seed = author ?? message
    const hasDiffstat =
      branch != null ||
      files != null ||
      additions != null ||
      deletions != null

    if (variant === "compact") {
      return (
        <div
          ref={ref}
          className={cn(
            "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5",
            className,
          )}
          style={commitPanelStyle(style)}
          {...props}
        >
          <CommitAvatar seed={seed} size={28} />
          <span
            className="block min-w-0 truncate"
            style={{
              color: "var(--aurora-text-primary)",
              fontFamily: "var(--aurora-font-display)",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 0,
              lineHeight: 1.2,
            }}
          >
            {message}
          </span>
          <span
            className="aurora-text-meta shrink-0"
            style={{ color: "var(--aurora-text-muted)", fontVariantNumeric: "tabular-nums" }}
          >
            {hash}
          </span>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("grid gap-3 px-4 py-3.5", className)}
        style={commitPanelStyle(style)}
        {...props}
      >
        {/* Header: avatar · message + meta + badge · hash chip */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5">
          <CommitAvatar seed={seed} size={44} />
          <span className="grid min-w-0 gap-0.5">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="min-w-0 truncate"
                style={{
                  color: "var(--aurora-text-primary)",
                  fontFamily: "var(--aurora-font-display)",
                  fontWeight: 700,
                  fontSize: 19,
                  letterSpacing: 0,
                  lineHeight: 1.15,
                }}
              >
                {message}
              </span>
              {badge ? (
                <span
                  className="shrink-0 rounded-[7px] px-1.5 py-0.5"
                  style={{
                    border: "1px solid var(--axon-orange-border)",
                    background: "var(--axon-orange-surface)",
                    color: "var(--axon-orange-strong)",
                    fontFamily: "var(--aurora-font-sans)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "var(--aurora-letter-eyebrow)",
                    lineHeight: 1.4,
                    textTransform: "uppercase",
                  }}
                >
                  AI
                </span>
              ) : null}
            </span>
            {author || time ? (
              <span className="aurora-text-meta block truncate">
                {author}
                {author && time ? " · " : ""}
                {time}
              </span>
            ) : null}
          </span>
          <HashChip hash={hash} />
        </div>

        {/* Diffstat: branch · files / additions / deletions */}
        {hasDiffstat ? (
          <>
            <div
              aria-hidden
              style={{ height: 1, background: "var(--aurora-border-default)" }}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                {branch != null ? (
                  <>
                    <GitBranch
                      className="size-3.5 shrink-0"
                      aria-hidden
                      style={{ color: "var(--aurora-text-muted)" }}
                    />
                    <span
                      className="aurora-text-meta truncate"
                      style={{ color: "var(--aurora-text-muted)" }}
                    >
                      {branch}
                    </span>
                  </>
                ) : null}
              </span>
              <span
                className="flex shrink-0 items-center gap-3.5 aurora-text-meta"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {files != null ? (
                  <span style={{ color: "var(--aurora-text-muted)" }}>{files} files</span>
                ) : null}
                {additions != null ? (
                  <span style={{ color: "var(--aurora-success)" }}>+{additions}</span>
                ) : null}
                {deletions != null ? (
                  <span style={{ color: "var(--aurora-error)" }}>&minus;{deletions}</span>
                ) : null}
              </span>
            </div>
          </>
        ) : null}
      </div>
    )
  },
)
Commit.displayName = "Commit"

export { Commit }
