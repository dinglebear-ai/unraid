import * as React from "react"
import { Check, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OAuthScope {
  id: string
  label: string
  description?: string
  sensitive?: boolean
}

export interface OAuthToken {
  id: string
  name: string
  scopes: string[]
  createdAt: string
  lastUsed?: string
}

export interface OAuthApp {
  name: string
  description?: string
  iconUrl?: string
  developer?: string
}

export type OAuthMode = "consent" | "success" | "tokens"

export interface OAuthProps {
  app: OAuthApp
  scopes: OAuthScope[]
  mode?: OAuthMode
  tokens?: OAuthToken[]
  onAllow?: () => void
  onDeny?: () => void
  onRevoke?: (tokenId: string) => void
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ICON_STROKE = 1.8

const OAUTH_RESPONSIVE_CSS = `
@media (max-width: 640px) {
  .aurora-oauth-token-header {
    display: none !important;
  }

  .aurora-oauth-token-row {
    grid-template-columns: 1fr !important;
    align-items: stretch !important;
  }

  .aurora-oauth-token-row [data-aurora-token-cell] {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal !important;
  }

  .aurora-oauth-token-actions {
    justify-content: flex-start !important;
  }
}
`

function CheckIcon({ size = 14, color = "var(--aurora-success)" }: { size?: number; color?: string }) {
  return (
    <Check
      size={size}
      strokeWidth={ICON_STROKE}
      aria-hidden="true"
      style={{ color, flexShrink: 0 }}
    />
  )
}

function AnimatedCheckIcon() {
  return (
    <div
      style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "color-mix(in srgb, var(--aurora-success) 12%, transparent)",
        border: "2px solid color-mix(in srgb, var(--aurora-success) 40%, transparent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "aurora-check-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}
    >
      <CircleCheck
        size={32}
        strokeWidth={ICON_STROKE}
        aria-hidden="true"
        style={{ color: "var(--aurora-success)" }}
      />
    </div>
  )
}

function AppIcon({ app }: { app: OAuthApp }) {
  if (app.iconUrl) {
    return (
      <img
        src={app.iconUrl}
        alt={app.name}
        width={48}
        height={48}
        style={{ borderRadius: "12px", flexShrink: 0 }}
      />
    )
  }
  // Initials fallback
  const initial = app.name.charAt(0).toUpperCase()
  return (
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, var(--aurora-accent-deep), var(--aurora-accent-primary))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--aurora-font-display)",
        fontSize: "20px",
        fontWeight: 800,
        color: "var(--aurora-accent-foreground)",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function AllowButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="aurora"
      size="lg"
      onClick={onClick}
      style={{ flex: 1 }}
    >
      Allow
    </Button>
  )
}

function DenyButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="neutral"
      size="lg"
      onClick={onClick}
      style={{ flex: 1 }}
    >
      Deny
    </Button>
  )
}

function RevokeButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onClick}
    >
      Revoke
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Consent view
// ---------------------------------------------------------------------------

function ConsentView({ app, scopes, onAllow, onDeny }: OAuthProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* App header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <AppIcon app={app} />
        <div>
          <div
            style={{
              fontFamily: "var(--aurora-font-display)",
              fontSize: "17px",
              fontWeight: 800,
              color: "var(--aurora-text-primary)",
            }}
          >
            {app.name}
          </div>
          {app.developer && (
            <div
              style={{
                fontFamily: "var(--aurora-font-sans)",
                fontSize: "12px",
                color: "var(--aurora-text-muted)",
                marginTop: "2px",
              }}
            >
              by {app.developer}
            </div>
          )}
        </div>
      </div>

      {app.description && (
        <div
          style={{
            fontFamily: "var(--aurora-font-sans)",
            fontSize: "13px",
            color: "var(--aurora-text-muted)",
            lineHeight: 1.5,
          }}
        >
          {app.description}
        </div>
      )}

      {/* Scopes */}
      <div
        style={{
          background: "var(--aurora-control-surface)",
          border: "1px solid var(--aurora-border-default)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--aurora-border-default)",
            fontFamily: "var(--aurora-font-sans)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--aurora-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Requesting access to
        </div>
        {scopes.map((scope, i) => (
          <div
            key={scope.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "11px 14px",
              borderBottom:
                i < scopes.length - 1
                  ? "1px solid var(--aurora-border-default)"
                  : "none",
            }}
          >
            <div style={{ marginTop: "1px" }}>
              <CheckIcon
                color={scope.sensitive ? "var(--aurora-warn)" : "var(--aurora-success)"}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--aurora-font-sans)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: scope.sensitive ? "var(--aurora-warn)" : "var(--aurora-text-primary)",
                }}
              >
                {scope.label}
              </div>
              {scope.description && (
                <div
                  style={{
                    fontFamily: "var(--aurora-font-sans)",
                    fontSize: "12px",
                    color: "var(--aurora-text-muted)",
                    marginTop: "2px",
                    lineHeight: 1.4,
                  }}
                >
                  {scope.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px" }}>
        <DenyButton onClick={onDeny} />
        <AllowButton onClick={onAllow} />
      </div>

      <div
        style={{
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "11px",
          color: "var(--aurora-text-muted)",
          textAlign: "center",
          lineHeight: 1.45,
        }}
      >
        By clicking Allow, you authorize {app.name} to access your account
        according to its terms of service and privacy policy.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Success / callback view
// ---------------------------------------------------------------------------

function SuccessView({ app }: { app: OAuthApp }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "16px 0",
        textAlign: "center",
      }}
    >
      <AnimatedCheckIcon />
      <div>
        <div
          style={{
            fontFamily: "var(--aurora-font-display)",
            fontSize: "18px",
            fontWeight: 800,
            color: "var(--aurora-text-primary)",
            marginBottom: "8px",
          }}
        >
          Authorization complete
        </div>
        <div
          style={{
            fontFamily: "var(--aurora-font-sans)",
            fontSize: "13px",
            color: "var(--aurora-text-muted)",
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: "var(--aurora-text-primary)" }}>{app.name}</strong> has been
          granted access.
          <br />
          You can close this window or return to the app.
        </div>
      </div>
      <Button
        type="button"
        variant="neutral"
        onClick={() => window.close?.()}
        style={{
          marginTop: "4px",
        }}
      >
        Close window
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Token management table
// ---------------------------------------------------------------------------

function TokensView({ tokens = [], onRevoke }: { tokens?: OAuthToken[]; onRevoke?: (id: string) => void }) {
  return (
    <>
      <style>{OAUTH_RESPONSIVE_CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            fontFamily: "var(--aurora-font-display)",
            fontSize: "16px",
            fontWeight: 800,
            color: "var(--aurora-text-primary)",
          }}
        >
          Active tokens
        </div>

        {tokens.length === 0 ? (
          <div
            style={{
              fontFamily: "var(--aurora-font-sans)",
              fontSize: "13px",
              color: "var(--aurora-text-muted)",
              padding: "24px",
              textAlign: "center",
              border: "1px solid var(--aurora-border-default)",
              borderRadius: "12px",
            }}
          >
            No active tokens
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--aurora-border-default)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              className="aurora-oauth-token-header"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 100px 100px 70px",
                padding: "8px 14px",
                background: "var(--aurora-panel-strong)",
                borderBottom: "1px solid var(--aurora-border-default)",
                fontFamily: "var(--aurora-font-sans)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--aurora-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <span>Token</span>
              <span>Scopes</span>
              <span>Created</span>
              <span>Last used</span>
              <span />
            </div>

            {tokens.map((token, i) => (
              <TokenRow
                key={token.id}
                token={token}
                onRevoke={onRevoke}
                isLast={i === tokens.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function TokenRow({
  token,
  onRevoke,
  isLast,
}: {
  token: OAuthToken
  onRevoke?: (id: string) => void
  isLast: boolean
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      className="aurora-oauth-token-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 100px 100px 70px",
        alignItems: "center",
        padding: "10px 14px",
        background: hovered ? "var(--aurora-hover-bg)" : "transparent",
        borderBottom: isLast ? "none" : "1px solid var(--aurora-border-default)",
        transition: "background 0.1s",
        gap: "8px",
      }}
    >
      <span
        data-aurora-token-cell
        style={{
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "13px",
          color: "var(--aurora-text-primary)",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {token.name}
      </span>

      <div data-aurora-token-cell style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {token.scopes.slice(0, 2).map((s) => (
          <span
            key={s}
            style={{
              display: "inline-block",
              padding: "1px 6px",
              borderRadius: "4px",
              background: "color-mix(in srgb, var(--aurora-accent-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--aurora-accent-primary) 18%, transparent)",
              color: "var(--aurora-accent-primary)",
              fontFamily: "var(--aurora-font-sans)",
              fontSize: "10px",
              fontWeight: 600,
            }}
          >
            {s}
          </span>
        ))}
        {token.scopes.length > 2 && (
          <span
            style={{
              fontFamily: "var(--aurora-font-sans)",
              fontSize: "11px",
              color: "var(--aurora-text-muted)",
              alignSelf: "center",
            }}
          >
            +{token.scopes.length - 2}
          </span>
        )}
      </div>

      <span
        data-aurora-token-cell
        style={{
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "12px",
          color: "var(--aurora-text-muted)",
        }}
      >
        {token.createdAt}
      </span>

      <span
        data-aurora-token-cell
        style={{
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "12px",
          color: "var(--aurora-text-muted)",
        }}
      >
        {token.lastUsed ?? "—"}
      </span>

      <div className="aurora-oauth-token-actions" style={{ display: "flex", justifyContent: "flex-end" }}>
        <RevokeButton onClick={() => onRevoke?.(token.id)} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main OAuth component
// ---------------------------------------------------------------------------

export const OAuth = function OAuth(
    { ref, app, scopes, mode = "consent", tokens, onAllow, onDeny, onRevoke }: OAuthProps & { ref?: React.Ref<HTMLDivElement> }
  ) {
    return (
      <div
        ref={ref}
        style={{
          minHeight: mode === "tokens" ? undefined : "100vh",
          display: "flex",
          alignItems: mode === "tokens" ? "flex-start" : "center",
          justifyContent: "center",
          background:
            mode === "tokens"
              ? "transparent"
              : "var(--aurora-shell-bg, var(--aurora-page-bg))",
          padding: mode === "tokens" ? "0" : "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: mode === "tokens" ? "640px" : "420px",
            background: mode === "tokens" ? "transparent" : "var(--aurora-panel-strong)",
            border: mode === "tokens" ? "none" : "1px solid var(--aurora-border-default)",
            borderRadius: mode === "tokens" ? "0" : "var(--aurora-radius-3)",
            padding: mode === "tokens" ? "0" : "32px 28px 28px",
            boxShadow: mode === "tokens" ? "none" : "var(--aurora-shadow-strong)",
          }}
        >
          {mode === "consent" && (
            <ConsentView
              app={app}
              scopes={scopes}
              onAllow={onAllow}
              onDeny={onDeny}
            />
          )}
          {mode === "success" && <SuccessView app={app} />}
          {mode === "tokens" && <TokensView tokens={tokens} onRevoke={onRevoke} />}
        </div>
      </div>
    )
  }

export default OAuth
