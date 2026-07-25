import * as React from "react"
import { Avatar as AuroraAvatar } from "@/components/ui/aurora/avatar"
import { Button } from "@/components/ui/aurora/button"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MessageProps extends React.HTMLAttributes<HTMLElement> {
  role?: "assistant" | "user" | "system"
  /** Timestamp shown in the hover-revealed meta row */
  time?: React.ReactNode
  /** Action buttons shown in the hover-revealed meta row */
  actions?: React.ReactNode
}

export interface MessageAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string
  tone?: "axon" | "cyan" | "rose" | "muted"
  status?: "online" | "away" | "busy" | "offline"
}

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: MessageProps["role"]
  /** Append a blinking caret to signal an in-progress stream */
  streaming?: boolean
}

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

// ─── Message ─────────────────────────────────────────────────────────────────
// Turn row: avatar + bubble, with a timestamp/actions meta row revealed on hover.

const Message = ({ ref, className, role = "assistant", time, actions, style, children, ...props }: MessageProps & { ref?: React.Ref<HTMLElement> }) => {
    const isUser = role === "user"
    const hasMeta = time != null || actions != null

    return (
      <article
        ref={ref}
        className={["group/aurora-msg flex flex-col", className].filter(Boolean).join(" ")}
        data-role={role}
        style={{
          color: "var(--aurora-text-primary)",
          alignItems: isUser ? "flex-end" : "stretch",
          ...style,
        }}
        {...props}
      >
        <div
          className="flex gap-[10px]"
          style={{ justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start" }}
        >
          {children}
        </div>
        {hasMeta && (
          <div
            className="flex items-center gap-[6px] opacity-0 transition-opacity duration-150 ease-out group-hover/aurora-msg:opacity-100"
            style={{
              marginTop: 5,
              justifyContent: isUser ? "flex-end" : "flex-start",
            }}
          >
            {time != null && (
              <span style={{ fontSize: "10.5px", color: "var(--aurora-text-muted)" }}>{time}</span>
            )}
            {actions}
          </div>
        )}
      </article>
    )
  }
Message.displayName = "Message"

// ─── MessageActionButton ──────────────────────────────────────────────────────
// 24×24 ghost icon button used inside the meta row.

const MessageActionButton = ({ ref, className, type = "button", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }) => (
  <Button
    ref={ref}
    type={type}
    variant="ghost"
    size="icon"
    className={["size-6 rounded-[6px] p-0", className].filter(Boolean).join(" ")}
    {...props}
  />
)
MessageActionButton.displayName = "MessageActionButton"

// ─── MessageAvatar ────────────────────────────────────────────────────────────

const MessageAvatar = ({ ref, className, label, tone = "axon", status = "online", style, ...props }: MessageAvatarProps & { ref?: React.Ref<React.ElementRef<typeof AuroraAvatar>> }) => {
  const color =
    tone === "axon"
      ? "var(--axon-orange)"
      : tone === "rose"
      ? "var(--aurora-accent-pink)"
      : tone === "cyan"
        ? "var(--aurora-accent-primary)"
        : "var(--aurora-text-muted)"

  return (
    <AuroraAvatar
      ref={ref}
      variant="status"
      status={status}
      size={34}
      alt={label}
      fallback={label.slice(0, 2).toUpperCase()}
      className={className}
      style={{
        borderRadius: "50%",
        border: `1.5px solid color-mix(in srgb, ${color} 30%, var(--aurora-border-default))`,
        background: `color-mix(in srgb, ${color} 12%, var(--aurora-panel-medium))`,
        boxShadow: "var(--aurora-highlight-medium)",
        color,
        fontFamily: "var(--aurora-font-display)",
        fontSize: 12,
        fontWeight: 800,
        ...style,
      }}
      {...props}
    />
  )
}
MessageAvatar.displayName = "MessageAvatar"

// ─── MessageContent ────────────────────────────────────────────────────────────
// Bubble tints: neutral panel for assistant/system, cyan-tinted for user.

const bubbleTone = {
  assistant: {
    background:
      "linear-gradient(180deg, color-mix(in srgb, var(--axon-orange) 9%, var(--aurora-panel-strong)), var(--aurora-panel-medium))",
    borderColor: "color-mix(in srgb, var(--axon-orange) 24%, var(--aurora-border-default))",
    shadow:
      "0 14px 30px color-mix(in srgb, var(--aurora-page-bg) 54%, transparent), var(--aurora-highlight-medium)",
  },
  user: {
    background:
      "linear-gradient(180deg, color-mix(in srgb, var(--aurora-accent-primary) 13%, var(--aurora-panel-medium)), color-mix(in srgb, var(--aurora-accent-primary) 7%, var(--aurora-panel-medium)))",
    borderColor: "color-mix(in srgb, var(--aurora-accent-primary) 36%, var(--aurora-border-default))",
    shadow:
      "0 14px 30px color-mix(in srgb, var(--aurora-accent-primary) 7%, transparent), var(--aurora-highlight-medium)",
  },
  system: {
    background: "color-mix(in srgb, var(--aurora-text-muted) 8%, var(--aurora-panel-medium))",
    borderColor: "var(--aurora-border-default)",
    shadow: "var(--aurora-highlight-medium)",
  },
} as const

const MessageContent = ({ ref, className, style, tone = "assistant", streaming = false, children, ...props }: MessageContentProps & { ref?: React.Ref<HTMLDivElement> }) => {
    return (
      <div
        ref={ref}
        className={[
          "min-w-0 border px-4 py-3 aurora-text-body",
          tone === "user" ? "rounded-[16px_16px_6px_16px]" : "rounded-[16px_16px_16px_6px]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          background: bubbleTone[tone].background,
          borderColor: bubbleTone[tone].borderColor,
          boxShadow: bubbleTone[tone].shadow,
          lineHeight: "var(--aurora-line-body)",
          ...style,
        }}
        {...props}
      >
        {children}
        {streaming && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 2,
              height: "1em",
              marginLeft: 1,
              verticalAlign: "text-bottom",
              borderRadius: 1,
              background: "var(--aurora-accent-pink)",
              animation: "aurora-msg-caret 1.1s steps(1) infinite",
            }}
          />
        )}
      </div>
    )
  }
MessageContent.displayName = "MessageContent"

export { Message, MessageActionButton, MessageAvatar, MessageContent }
