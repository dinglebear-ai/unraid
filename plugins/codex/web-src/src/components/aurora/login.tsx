"use client"

import * as React from "react"
import { Eye, EyeOff, Mail } from "lucide-react"
import { Button } from "@/components/ui/aurora/button"
import { Input } from "@/components/ui/aurora/input"
import { InputOTP } from "@/components/ui/aurora/input-otp"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoginMode = "password" | "magic-link-sent" | "2fa"

export interface LoginProvider {
  /** Button label, e.g. "Continue with GitHub". */
  label: string
  /** Leading icon element (sized ~16px). */
  icon?: React.ReactNode
  /** Click handler for this provider. */
  onClick?: () => void
}

export interface LoginProps {
  mode?: LoginMode
  /** Card heading. Defaults to "Sign in". */
  title?: string
  /** Muted line under the heading. Defaults to "Welcome back to the console." */
  subtitle?: string
  onSubmit?: (data: { email?: string; password?: string; otp?: string }) => void
  onMagicLink?: (email: string) => void
  /** SSO / OAuth providers rendered under the "or continue with" divider. */
  providers?: LoginProvider[]
  /** Footer content centered under the card (e.g. "No account? Request access"). */
  footer?: React.ReactNode
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ICON_STROKE = 1.7

function EnvelopeIcon() {
  return (
    <Mail
      size={40}
      strokeWidth={ICON_STROKE}
      aria-hidden="true"
      style={{ color: "var(--aurora-accent-primary)" }}
    />
  )
}

function EyeIcon({ visible }: { visible: boolean }) {
  const Icon = visible ? Eye : EyeOff

  return <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
}

// ---------------------------------------------------------------------------
// Shared input component
// ---------------------------------------------------------------------------

interface AuroraInputProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  trailing?: React.ReactNode
}

function AuroraInput({ id, label, type = "text", value, onChange, placeholder, autoComplete, trailing }: AuroraInputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "var(--aurora-letter-ui)",
          color: "var(--aurora-text-primary)",
        }}
      >
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        endAdornment={trailing}
        size="lg"
        className="rounded-[10px]"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Divider — "or continue with"
// ---------------------------------------------------------------------------

function OrDivider({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "2px 0",
      }}
    >
      <div style={{ flex: 1, height: "1px", background: "var(--aurora-border-default)" }} />
      <span
        style={{
          fontFamily: "var(--aurora-font-sans)",
          fontSize: "12px",
          color: "var(--aurora-text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: "var(--aurora-border-default)" }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Provider buttons (SSO / OAuth)
// ---------------------------------------------------------------------------

function ProviderButtons({ providers }: { providers: LoginProvider[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {providers.map((p, i) => (
        <Button
          key={`${p.label}-${i}`}
          type="button"
          variant="neutral"
          size="lg"
          block
          iconLeft={p.icon}
          onClick={p.onClick}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// OTP input — 6 boxes, auto-advance
// ---------------------------------------------------------------------------

function OtpInput({ onComplete }: { onComplete?: (otp: string) => void }) {
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    if (value.length === 6) onComplete?.(value)
  }, [onComplete, value])

  return (
    <InputOTP length={6} value={value} onChange={setValue} className="justify-center gap-2.5" />
  )
}

// ---------------------------------------------------------------------------
// Password state view
// ---------------------------------------------------------------------------

function PasswordView({ onSubmit, onMagicLink, providers, footer }: LoginProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPw, setShowPw] = React.useState(false)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.({ email, password }) }}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      <AuroraInput
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="operator@labby.io"
        autoComplete="email"
      />
      <AuroraInput
        id="password"
        label="Password"
        type={showPw ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        autoComplete="current-password"
        trailing={
          <Button variant="plain" size="unstyled"
            type="button"
            onClick={() => setShowPw((p) => !p)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              padding: 0,
              lineHeight: 1,
            }}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <EyeIcon visible={showPw} />
          </Button>
        }
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
        <Button variant="plain" size="unstyled"
          type="button"
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--aurora-font-sans)",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--aurora-accent-primary)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Forgot password?
        </Button>
      </div>

      <Button type="submit" variant="aurora" size="lg" block>
        Sign in
      </Button>

      {(providers && providers.length > 0) ? (
        <>
          <OrDivider label="or continue with" />
          <ProviderButtons providers={providers} />
        </>
      ) : (
        <>
          <OrDivider label="or" />
          <Button
            type="button"
            variant="neutral"
            size="lg"
            block
            onClick={() => email && onMagicLink?.(email)}
          >
            Send magic link
          </Button>
        </>
      )}

      {footer ? (
        <div
          style={{
            fontFamily: "var(--aurora-font-sans)",
            fontSize: "14px",
            color: "var(--aurora-text-muted)",
            textAlign: "center",
            marginTop: "2px",
          }}
        >
          {footer}
        </div>
      ) : null}
    </form>
  )
}

// ---------------------------------------------------------------------------
// Magic link sent view
// ---------------------------------------------------------------------------

function MagicLinkSentView() {
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
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "color-mix(in srgb, var(--aurora-accent-primary) 10%, transparent)",
          border: "1px solid color-mix(in srgb, var(--aurora-accent-primary) 25%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EnvelopeIcon />
      </div>
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
          Check your email
        </div>
        <div
          style={{
            fontFamily: "var(--aurora-font-sans)",
            fontSize: "13px",
            color: "var(--aurora-text-muted)",
            lineHeight: 1.5,
          }}
        >
          A sign-in link was sent to your email.
          <br />
          Open the link to continue.
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2FA view
// ---------------------------------------------------------------------------

function TwoFactorView({ onSubmit }: LoginProps) {
  const [otp, setOtp] = React.useState("")

  function handleComplete(code: string) {
    setOtp(code)
    onSubmit?.({ otp: code })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--aurora-font-sans)",
            fontSize: "13px",
            color: "var(--aurora-text-muted)",
            marginBottom: "20px",
          }}
        >
          Enter the 6-digit code from your authenticator app.
        </div>
        <OtpInput onComplete={handleComplete} />
      </div>
      <Button
        type="button"
        variant="aurora"
        size="lg"
        block
        disabled={otp.length < 6}
        onClick={() => otp.length === 6 && onSubmit?.({ otp })}
      >
        Verify
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Login component
// ---------------------------------------------------------------------------

export const Login = function Login(
    { ref, mode = "password", title, subtitle, onSubmit, onMagicLink, providers, footer }: LoginProps & { ref?: React.Ref<HTMLDivElement> }
  ) {
    const heading =
      title ??
      (mode === "magic-link-sent"
        ? "Magic link sent"
        : mode === "2fa"
        ? "Two-factor auth"
        : "Sign in")

    const sub =
      subtitle ??
      (mode === "2fa"
        ? "Almost there"
        : mode === "magic-link-sent"
        ? "Check your email for the link."
        : "Welcome back to the console.")

    return (
      <div
        ref={ref}
        style={{
          width: "100%",
          maxWidth: "420px",
          // Radial cyan glow at top of the card surface
          backgroundImage:
            "radial-gradient(700px 420px at 50% -10%, color-mix(in srgb, var(--aurora-accent-primary) 8%, transparent), transparent 60%)",
          backgroundColor: "var(--aurora-panel-strong)",
          border: "1px solid var(--aurora-border-default)",
          borderRadius: "var(--aurora-radius-3)",
          padding: "36px 36px 32px",
          boxShadow: "var(--aurora-shadow-strong)",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          boxSizing: "border-box",
        }}
      >
        {/* Heading */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              fontFamily: "var(--aurora-font-display)",
              fontSize: "30px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: 0,
              color: "var(--aurora-text-primary)",
            }}
          >
            {heading}
          </div>
          {sub && (
            <div
              style={{
                fontFamily: "var(--aurora-font-sans)",
                fontSize: "16px",
                color: "var(--aurora-text-muted)",
              }}
            >
              {sub}
            </div>
          )}
        </div>

        {/* Mode content */}
        {mode === "magic-link-sent" ? (
          <MagicLinkSentView />
        ) : mode === "2fa" ? (
          <TwoFactorView onSubmit={onSubmit} />
        ) : (
          <PasswordView
            onSubmit={onSubmit}
            onMagicLink={onMagicLink}
            providers={providers}
            footer={footer}
          />
        )}
      </div>
    )
  }

export default Login
