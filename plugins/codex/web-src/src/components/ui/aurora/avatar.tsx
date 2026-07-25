import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap = {
  sm: { wh: 24, text: 9, statusSize: 7, statusOffset: -1 },
  md: { wh: 32, text: 11, statusSize: 9, statusOffset: -1 },
  lg: { wh: 40, text: 13, statusSize: 10, statusOffset: 0 },
  xl: { wh: 56, text: 17, statusSize: 13, statusOffset: 1 },
} as const

type AvatarSize = keyof typeof sizeMap
type AvatarVariant = "default" | "beacon" | "bot" | "status"
type AvatarShape = "circle" | "square"
type StatusColor = "online" | "away" | "busy" | "offline"

const statusColorMap: Record<StatusColor, string> = {
  online: "var(--aurora-success)",
  away: "var(--aurora-warn)",
  busy: "var(--aurora-error)",
  offline: "var(--aurora-status-offline)",
}

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ─── Avatar component ─────────────────────────────────────────────────────────

export interface AvatarProps
  extends Omit<
    React.ComponentProps<typeof AvatarPrimitive.Root>,
    "color"
  > {
  /** Visual variant */
  variant?: AvatarVariant
  /** Size preset or explicit pixel size */
  size?: AvatarSize | number
  /** Image src */
  src?: string
  /** Alt text */
  alt?: string
  /** Fallback text (initials) — alias for `initials` */
  fallback?: string
  /**
   * Initials rendered as the fallback. Drives the tone-tinted surface, ring,
   * and text color. Takes precedence over `fallback`.
   */
  initials?: string
  /**
   * Tone — any CSS color (typically an Aurora accent token such as
   * `var(--aurora-accent-primary)`). Colors the initials, the tinted surface
   * and the soft tone ring.
   */
  tone?: string
  /** Trusted React icon rendered instead of initials. */
  icon?: React.ReactNode
  /** Circle (default) or rounded square. */
  shape?: AvatarShape
  /** Adds an outer focus-style ring in the avatar's tone. */
  ring?: boolean
  /** Status dot color — shown when `status` is set or variant="status". */
  status?: StatusColor
}

const DEFAULT_TONE = "var(--aurora-accent-primary)"

function Avatar({
  ref,
  className,
  variant = "default",
  size = "md",
  src,
  alt = "",
  fallback,
  initials,
  tone = DEFAULT_TONE,
  icon,
  shape = "circle",
  ring = false,
  status,
  style,
  ...props
}: AvatarProps & { ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>> }) {
  const dims =
    typeof size === "number"
      ? {
          wh: size,
          text: Math.max(9, Math.round(size * 0.34)),
          statusSize: Math.max(7, Math.round(size * 0.26)),
          statusOffset: -1,
        }
      : sizeMap[size]
  const isBot = variant === "bot"
  const isBeacon = variant === "beacon"
  const isSquare = shape === "square"
  // Status dot shows whenever a status is explicitly provided OR variant="status".
  const hasStatus = status != null || variant === "status"
  const resolvedStatus: StatusColor = status ?? "online"
  const label = initials ?? fallback ?? alt?.slice(0, 2) ?? "?"

  // Tone-tinted surface + soft tone ring (CD default treatment).
  const toneSurface = `color-mix(in srgb, ${tone} 15%, var(--aurora-panel-strong))`
  const toneRing: React.CSSProperties =
    variant === "default" || variant === "status"
      ? {
          boxShadow: [
            `0 0 0 1px color-mix(in srgb, ${tone} 38%, transparent)`,
            `0 2px 10px color-mix(in srgb, ${tone} 22%, transparent)`,
          ].join(", "),
        }
      : {}

  // Bot variant: square border, cyan glow
  const botStyle: React.CSSProperties = isBot
    ? {
        borderRadius: "var(--aurora-radius-1, 14px)",
        border: "1.5px solid var(--aurora-border-strong)",
        boxShadow: [
          "0 0 0 1px color-mix(in srgb, var(--aurora-accent-primary) 20%, transparent)",
          "0 2px 12px color-mix(in srgb, var(--aurora-accent-primary) 18%, transparent)",
        ].join(", "),
      }
    : {}

  // Resolved corner radius (square shape rounds to a soft squircle).
  const squareRadius = `clamp(8px, ${Math.round(dims.wh * 0.32)}px, var(--aurora-radius-1, 14px))`
  const radius = isBot
    ? "var(--aurora-radius-1, 14px)"
    : isSquare
      ? squareRadius
      : "50%"

  const rootStyle: React.CSSProperties = {
    width: dims.wh,
    height: dims.wh,
    minWidth: dims.wh,
    borderRadius: radius,
    ...toneRing,
    ...botStyle,
    ...style,
  }

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: dims.wh, height: dims.wh }}
    >
      {/* Beacon pulsing outer ring */}
      {isBeacon && (
        <>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: "2px solid var(--aurora-accent-primary)",
              animation:
                "aurora-beacon-ping 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
              pointerEvents: "none",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: "50%",
              border:
                "1.5px solid color-mix(in srgb, var(--aurora-accent-primary) 50%, transparent)",
              animation: "aurora-beacon-ring 1.8s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Tone ring (CD `ring` prop) — soft outer ring in the avatar's tone. */}
      {ring && !isBeacon && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: radius,
            border: `1.5px solid color-mix(in srgb, ${tone} 55%, transparent)`,
            boxShadow: `0 0 12px color-mix(in srgb, ${tone} 30%, transparent)`,
            pointerEvents: "none",
          }}
        />
      )}

      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center overflow-hidden",
          "select-none shrink-0"
        )}
        style={rootStyle}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          style={{ borderRadius: "inherit" }}
        />
        <AvatarPrimitive.Fallback
          className={cn(
            "flex h-full w-full items-center justify-center font-semibold uppercase"
          )}
          style={{
            background: isBot ? "var(--aurora-panel-strong)" : toneSurface,
            color: tone,
            fontSize: dims.text,
            fontFamily: "var(--aurora-font-sans, Inter, sans-serif)",
          }}
          delayMs={300}
        >
          {icon ? (
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center [&_svg]:size-full"
              style={{ width: Math.round(dims.wh * 0.52), height: Math.round(dims.wh * 0.52) }}
            >
              {icon}
            </span>
          ) : (
            label
          )}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>

      {/* Status dot */}
      {hasStatus && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: dims.statusOffset,
            right: dims.statusOffset,
            width: dims.statusSize,
            height: dims.statusSize,
            borderRadius: "50%",
            backgroundColor: statusColorMap[resolvedStatus],
            border: "2px solid var(--aurora-page-bg)",
            boxShadow: `0 0 4px ${statusColorMap[resolvedStatus]}`,
          }}
        />
      )}
    </span>
  )
}

// ─── AvatarGroup ──────────────────────────────────────────────────────────────

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of avatars to render before collapsing into a `+N` chip. */
  max?: number
  /** Explicit pixel size applied to every child + the overflow chip. */
  size?: AvatarSize | number
  children: React.ReactNode
}

function AvatarGroup({
  ref,
  className,
  max,
  size = 34,
  children,
  style,
  ...props
}: AvatarGroupProps & { ref?: React.Ref<HTMLDivElement> }) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  const shown = max != null ? items.slice(0, max) : items
  const overflow = items.length - shown.length
  const wh = typeof size === "number" ? size : sizeMap[size].wh
  // Overlap by ~1/3 of the avatar width (CD overlap).
  const overlap = Math.round(wh / 3)

  return (
    <div
      ref={ref}
      className={cn("inline-flex items-center", className)}
      style={{ ...style }}
      {...props}
    >
      {shown.map((child, i) => {
        const el = child as React.ReactElement<AvatarProps>
        return (
          <span
            key={el.key ?? i}
            style={{
              marginLeft: i === 0 ? 0 : -overlap,
              borderRadius: "50%",
              // Ring the page bg so overlapping avatars read as separate.
              boxShadow: "0 0 0 2px var(--aurora-page-bg)",
              position: "relative",
              zIndex: shown.length - i,
            }}
          >
            {React.cloneElement(el, { size: el.props.size ?? size })}
          </span>
        )
      })}

      {overflow > 0 && (
        <span
          style={{
            marginLeft: -overlap,
            width: wh,
            height: wh,
            minWidth: wh,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--aurora-panel-strong)",
            color: "var(--aurora-text-primary)",
            fontSize: Math.max(9, Math.round(wh * 0.32)),
            fontWeight: 600,
            fontFamily: "var(--aurora-font-sans, Inter, sans-serif)",
            boxShadow: [
              "0 0 0 2px var(--aurora-page-bg)",
              "inset 0 0 0 1px var(--aurora-border-default)",
            ].join(", "),
            position: "relative",
            zIndex: 0,
          }}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

// ─── Sub-components for composable use ───────────────────────────────────────

function AvatarImage({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & { ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>> }) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & { ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>> }) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full",
        "bg-[var(--aurora-panel-strong)] text-[var(--aurora-accent-primary)]",
        "text-xs font-semibold uppercase",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarGroup, AvatarImage, AvatarFallback }
export default Avatar
