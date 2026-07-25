"use client";

import * as React from "react";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BannerStatus = "success" | "warn" | "error" | "info";
export type BannerStyle = "elevated" | "tag";

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BannerStatus;
  /**
   * CD-parity alias for {@link variant}. When provided it takes precedence so
   * Claude Design compositions can drive tone directly (`success | warn | error`).
   */
  tone?: BannerStatus;
  kind?: BannerStyle;
  title?: string;
  description?: string;
  onDismiss?: () => void;
  /** CD-parity alias for {@link onDismiss}. */
  onClose?: () => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Status colour map
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<BannerStatus, string> = {
  success: "var(--aurora-success)",
  warn:    "var(--aurora-warn)",
  error:   "var(--aurora-error)",
  info:    "var(--aurora-accent-primary)",
};

const STATUS_LABEL: Record<BannerStatus, string> = {
  success: "OK",
  warn:    "Warn",
  error:   "Error",
  info:    "Info",
};

// ---------------------------------------------------------------------------
// Status icons — Lucide, 20px, currentColor
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: BannerStatus }) {
  const iconProps = { size: 20, strokeWidth: 1.75, "aria-hidden": true } as const;

  if (status === "success") return <CircleCheck {...iconProps} />;
  if (status === "warn") return <TriangleAlert {...iconProps} />;
  if (status === "error") return <CircleX {...iconProps} />;
  return <Info {...iconProps} />;
}

function getLiveProps(status: BannerStatus) {
  if (status === "warn" || status === "error") {
    return { role: "alert" as const, "aria-live": "assertive" as const };
  }

  return { role: "status" as const, "aria-live": "polite" as const };
}

// ---------------------------------------------------------------------------
// Elevated variant — Style A1 (CD-parity)
// <div class="banner-elev">
//   <span class="banner-elev-icon"><StatusIcon/></span>
//   <div><h4>…</h4><p>…</p></div>
//   <Button variant="plain" size="unstyled" class="banner-elev-dismiss">×</Button>
// </div>
// ---------------------------------------------------------------------------

function BannerElevated({
  variant = "info",
  title,
  description,
  onDismiss,
  action,
  children,
  className,
  ...rest
}: Omit<BannerProps, "kind" | "tone" | "onClose">) {
  const color = STATUS_COLOR[variant];
  const liveProps = getLiveProps(variant);

  const [visible, setVisible] = React.useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      className={cn("flex items-center gap-3.5 px-4 py-3.5", className)}
      style={{
        background: `color-mix(in srgb, ${color} 10%, var(--aurora-panel-strong))`,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        borderRadius: "var(--aurora-radius-2, 18px)",
        boxShadow: "var(--aurora-shadow-medium)",
      }}
      {...liveProps}
      {...rest}
    >
      {/* Icon chip — 44px rounded square, tone tint */}
      <span
        aria-hidden
        className="banner-elev-icon"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 12,
          color,
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`,
        }}
      >
        <StatusIcon status={variant} />
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <h4
            style={{
              margin: 0,
              fontFamily: "var(--aurora-font-sans)",
              fontSize: "var(--aurora-type-control)",
              fontWeight: 700,
              lineHeight: "var(--aurora-line-ui)",
              color: "var(--aurora-text-primary)",
            }}
          >
            {title}
          </h4>
        )}
        {description && (
          <p
            style={{
              margin: 0,
              marginTop: title ? 2 : 0,
              fontFamily: "var(--aurora-font-sans)",
              fontSize: "var(--aurora-type-label)",
              fontWeight: "var(--aurora-weight-body)",
              lineHeight: 1.5,
              color: "var(--aurora-text-muted)",
            }}
          >
            {description}
          </p>
        )}
        {children}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>

      {/* Dismiss × button */}
      {onDismiss && (
        <Button
          variant="plain"
          size="unstyled"
          type="button"
          aria-label="Dismiss"
          onClick={handleDismiss}
          className="banner-elev-dismiss ml-auto self-start rounded-[4px] p-0.5 text-[var(--aurora-text-muted)] transition-colors hover:text-[var(--aurora-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring)]"
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <X size={15} strokeWidth={1.75} aria-hidden />
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag variant — Style C
// <div class="banner-c banner-c-warn">
//   <span class="banner-c-tag">Warn</span>
//   <p>Message text here.</p>
// </div>
// ---------------------------------------------------------------------------

function BannerTag({
  variant = "info",
  title,
  description,
  children,
  className,
  ...rest
}: Omit<BannerProps, "kind" | "onDismiss" | "tone" | "onClose">) {
  const color = STATUS_COLOR[variant];
  const label = STATUS_LABEL[variant];
  const liveProps = getLiveProps(variant);

  return (
    <div
      className={cn("flex items-start gap-3", className)}
      style={{
        background: "var(--aurora-control-surface)",
        border: "1px solid var(--aurora-border-default)",
        borderRadius: "8px",
        padding: "10px 14px",
      }}
      {...liveProps}
      {...rest}
    >
      {/* Tag chip */}
      <span
        className="banner-c-tag"
        style={{
          flexShrink: 0,
          borderRadius: "4px",
          fontFamily: "var(--aurora-font-mono)",
          fontSize: "var(--aurora-type-micro)",
          fontWeight: "var(--aurora-weight-label)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          lineHeight: 1.4,
          padding: "2px 6px",
          color,
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        {label}
      </span>

      {/* Message */}
      <div
        className="min-w-0 flex-1"
        style={{
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "var(--aurora-type-control)",
          fontWeight: "var(--aurora-weight-body)",
          color: "var(--aurora-text-muted)",
          lineHeight: "var(--aurora-line-ui)",
        }}
      >
        {title ? (
          <span style={{ color: "var(--aurora-text-primary)", fontWeight: "var(--aurora-weight-ui)" }}>
            {title}
          </span>
        ) : null}
        {description ? <span>{title ? " " : null}{description}</span> : null}
        {children ? <span>{title || description ? " " : null}{children}</span> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function Banner({
  variant = "info",
  tone,
  kind: bannerStyle = "elevated",
  title,
  description,
  onDismiss,
  onClose,
  action,
  children,
  className,
  ...rest
}: BannerProps) {
  const status = tone ?? variant;
  const dismiss = onDismiss ?? onClose;

  if (bannerStyle === "tag") {
    return (
      <BannerTag
        variant={status}
        title={title}
        description={description}
        className={className}
        {...rest}
      >
        {children}
      </BannerTag>
    );
  }

  return (
    <BannerElevated
      variant={status}
      title={title}
      description={description}
      onDismiss={dismiss}
      action={action}
      className={className}
      {...rest}
    >
      {children}
    </BannerElevated>
  );
}

Banner.displayName = "Banner";
