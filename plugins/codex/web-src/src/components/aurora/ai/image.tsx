import * as React from "react"
import { CircleAlert, Maximize2, RotateCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { Spinner } from "@/components/ui/aurora/spinner"

// AiImage — an AI-generated image surface with ready / generating / failed
// states, an "AI" identity badge, model pill, prompt overlay, metadata footer
// (caption / dimensions / seed) and expand + regenerate / retry affordances.
//
// Visual spec ported from the Claude Design source. Axon orange is the
// AI/automation identity accent; cyan remains the primary UI accent; status
// colors come from the semantic token layer.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiImageStatus = "ready" | "generating" | "failed"

/** Common aspect ratios — also accepts any "W:H" string. */
export type AiImageAspect = "1:1" | "4:3" | "3:2" | "16:9" | "3:4" | (string & {})

export interface AuroraImageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Image source. When omitted (or `loading`/`status` is non-ready) the surface shows a state placeholder. */
  src?: string
  /** Alt text for the rendered image. */
  alt?: string
  /** State of the surface. Defaults to "ready"; `loading` forces "generating". */
  status?: AiImageStatus
  /** Convenience flag — same as `status="generating"`. */
  loading?: boolean
  /** Aspect ratio of the image frame (e.g. "4:3"). Defaults to "4:3". */
  aspect?: AiImageAspect
  /** Generation progress 0–1 — drives the bottom progress bar + percent label while generating. */
  progress?: number
  /** Model label shown in the top-right pill (e.g. "Imagen 3"). */
  model?: string
  /** Prompt text overlaid along the bottom of a ready image. */
  prompt?: string
  /** Caption shown in the footer below the frame. */
  caption?: string
  /** Pixel dimensions shown in the metadata row (e.g. "1024×768"). */
  dimensions?: string
  /** Seed shown in the metadata row. */
  seed?: string
  /** Regenerate handler — shows a "Regenerate" button in the ready footer. */
  onRegenerate?: () => void
  /** Expand handler — shows a hover "expand" affordance on a ready image. */
  onExpand?: () => void
  /** Retry handler — shows a "Retry" button in the failed state. */
  onRetry?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function aspectValue(aspect: AiImageAspect): string {
  // CSS aspect-ratio requires "W / H" — convert the "W:H" shorthand to that
  // form so browsers actually honour it; invalid values silently collapse the frame.
  return /^\d+\s*:\s*\d+$/.test(aspect)
    ? aspect.replace(/\s*:\s*/, " / ")
    : "4 / 3"
}

const AI_ORANGE = "var(--axon-orange)"

// Translucent scrim sits over the (opaque) image — opaque→translucent over an
// image is intentional (no banding seam against a flat surface).
const PROMPT_SCRIM =
  "linear-gradient(180deg, color-mix(in srgb, var(--aurora-page-bg) 0%, transparent) 0%, color-mix(in srgb, var(--aurora-page-bg) 82%, transparent) 100%)"

// ---------------------------------------------------------------------------
// Pills
// ---------------------------------------------------------------------------

function chipStyle(tone: "neutral" | "ai" = "neutral"): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 22,
    padding: "0 8px",
    borderRadius: 7,
    background:
      tone === "ai"
        ? "color-mix(in srgb, var(--axon-orange) 14%, var(--aurora-page-bg))"
        : "color-mix(in srgb, var(--aurora-page-bg) 64%, transparent)",
    border:
      tone === "ai"
        ? "1px solid var(--axon-orange-border)"
        : "1px solid color-mix(in srgb, var(--aurora-border-strong) 80%, transparent)",
    fontFamily: "var(--aurora-font-sans)",
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "var(--aurora-letter-label)",
    color: tone === "ai" ? AI_ORANGE : "var(--aurora-text-primary)",
    whiteSpace: "nowrap",
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Image = (
    { ref,
      src,
      alt = "",
      status,
      loading,
      aspect = "4:3",
      progress,
      model,
      prompt,
      caption,
      dimensions,
      seed,
      onRegenerate,
      onExpand,
      onRetry,
      className,
      style,
      ...props
    }: AuroraImageProps & { ref?: React.Ref<HTMLDivElement> }
  ) => {
    const resolved: AiImageStatus =
      status ?? (loading ? "generating" : src ? "ready" : "generating")
    const isFailed = resolved === "failed"
    const isGenerating = resolved === "generating"
    const isReady = resolved === "ready"

    const pct =
      typeof progress === "number"
        ? Math.round(Math.max(0, Math.min(1, progress)) * 100)
        : null

    const frameStyle: React.CSSProperties = {
      position: "relative",
      aspectRatio: aspectValue(aspect),
      width: "100%",
      overflow: "hidden",
      borderRadius: "var(--aurora-radius-1)",
      background:
        "radial-gradient(120% 120% at 62% 28%, color-mix(in srgb, var(--aurora-accent-primary) 24%, var(--aurora-panel-strong)) 0%, var(--aurora-panel-strong) 52%, var(--aurora-page-bg) 100%)",
      border: isFailed
        ? "1px solid color-mix(in srgb, var(--aurora-error) 42%, var(--aurora-border-strong))"
        : "1px solid var(--aurora-border-strong)",
      boxShadow: "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
    }

    return (
      <figure
        ref={ref}
        className={["aurora-ai-image grid gap-2", className].filter(Boolean).join(" ")}
        style={{ margin: 0, alignItems: "start", ...style }}
        {...props}
      >
        <div style={frameStyle}>
          {/* Image (ready only) */}
          {isReady && src ? (
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 size-full object-cover"
              draggable={false}
            />
          ) : null}

          {/* Top chrome: AI badge + model pill */}
          {(isReady || isGenerating) && (model || isReady) ? (
            <div
              className="absolute inset-x-0 top-0 flex items-start justify-between"
              style={{ padding: 10 }}
            >
              <span style={{ ...chipStyle("ai"), gap: 4 }}>
                <Sparkles className="size-3" aria-hidden style={{ color: AI_ORANGE }} />
                AI
              </span>
              {model ? <span style={chipStyle()}>{model}</span> : <span />}
            </div>
          ) : null}

          {/* Ready: prompt overlay + hover expand */}
          {isReady ? (
            <>
              {prompt ? (
                <figcaption
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    padding: "26px 12px 12px",
                    background: PROMPT_SCRIM,
                    fontFamily: "var(--aurora-font-sans)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    color: "var(--aurora-text-primary)",
                  }}
                >
                  {prompt}
                </figcaption>
              ) : null}
              {onExpand ? (
                <Button
                  type="button"
                  size="icon"
                  variant="neutral"
                  aria-label="Expand image"
                  onClick={onExpand}
                  className="absolute"
                  style={{
                    top: 10,
                    right: model ? 88 : 10,
                    opacity: 0.92,
                    transition: "opacity var(--motion-duration-fast, 160ms) var(--motion-ease-out, ease)",
                  }}
                >
                  <Maximize2 className="size-4" aria-hidden />
                </Button>
              ) : null}
            </>
          ) : null}

          {/* Generating: spinner + label + progress bar */}
          {isGenerating ? (
            <div className="absolute inset-0 grid place-items-center" style={{ padding: 16 }}>
              <div className="grid justify-items-center gap-3">
                <Spinner size="lg" tone="cyan" />
                <span
                  style={{
                    fontFamily: "var(--aurora-font-sans)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--aurora-text-muted)",
                  }}
                >
                  Generating{pct !== null ? ` · ${pct}%` : ""}
                </span>
              </div>
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0"
                style={{ height: 4, background: "color-mix(in srgb, var(--aurora-page-bg) 70%, transparent)" }}
              >
                <div
                  role="progressbar"
                  aria-valuenow={pct ?? undefined}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Generation progress"
                  style={{
                    height: "100%",
                    width: pct !== null ? `${pct}%` : "40%",
                    background:
                      "linear-gradient(90deg, var(--axon-orange), color-mix(in srgb, var(--axon-orange) 58%, var(--aurora-accent-primary)))",
                    boxShadow: "0 0 10px color-mix(in srgb, var(--axon-orange) 45%, transparent)",
                    transition: "width var(--motion-duration-slow, 360ms) var(--motion-ease-out, ease)",
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* Failed: alert icon + heading + retry */}
          {isFailed ? (
            <div className="absolute inset-0 grid place-items-center" style={{ padding: 16 }}>
              <div className="grid justify-items-center gap-3 text-center">
                <CircleAlert
                  className="size-7"
                  aria-hidden
                  style={{ color: "var(--aurora-error)" }}
                />
                <span
                  style={{
                    fontFamily: "var(--aurora-font-sans)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--aurora-text-primary)",
                  }}
                >
                  Generation failed
                </span>
                {onRetry ? (
                  <Button type="button" size="sm" variant="neutral" onClick={onRetry}>
                    <RotateCw className="size-3.5" aria-hidden />
                    Retry
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer: caption + metadata + regenerate */}
        {caption || dimensions || seed || onRegenerate ? (
          <div className="grid gap-1">
            {caption ? <span className="aurora-text-meta" style={{ color: "var(--aurora-text-muted)" }}>{caption}</span> : null}
            {dimensions || seed || onRegenerate ? (
              <div className="flex items-end justify-between gap-3">
                {dimensions || seed ? (
                  <span
                    className="aurora-text-meta tabular-nums"
                    style={{ color: "var(--aurora-text-muted)", fontSize: 11, lineHeight: 1.5 }}
                  >
                    {dimensions}
                    {dimensions && seed ? <>{"  "}seed {seed}</> : seed ? <>seed {seed}</> : null}
                  </span>
                ) : (
                  <span />
                )}
                {onRegenerate ? (
                  <Button type="button" size="sm" variant="ghost" onClick={onRegenerate}>
                    <RotateCw className="size-3.5" aria-hidden />
                    Regenerate
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </figure>
    )
  }
Image.displayName = "Image"

export { Image }
export default Image
