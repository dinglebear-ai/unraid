import * as React from "react"
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  SlidersHorizontal,
} from "lucide-react"
import { CodeBlock } from "@/components/aurora/code-block"
import { Conversation } from "@/components/aurora/ai/conversation"
import {
  PermissionChip,
  type ToolPermission,
} from "@/components/aurora/permissions-dropdown"
import {
  PromptInput,
  type Attachment,
} from "@/components/aurora/prompt-input"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/aurora/sheet"
import { Banner } from "@/components/ui/aurora/banner"
import { Button } from "@/components/ui/aurora/button"
import { StatusIndicator } from "@/components/ui/aurora/status-indicator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/aurora/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/aurora/tooltip"
import { useCodexAppServer } from "@/protocol"
import {
  ContextRenderer,
  PlanRenderer,
  RequestRenderer,
  SessionContextRenderer,
  TimelineRenderer,
} from "@/renderers"

const PERMISSIONS: ToolPermission[] = [
  {
    id: "commands",
    name: "Commands",
    description: "Command execution requires approval when Codex requests it.",
    state: "ask",
  },
  {
    id: "files",
    name: "File Changes",
    description: "File changes require approval when Codex requests it.",
    state: "ask",
  },
  {
    id: "mcp",
    name: "MCP Writes",
    description: "MCP servers can elicit confirmation before write actions.",
    state: "ask",
  },
]

function connectionTone(status: string) {
  if (status === "connected" || status === "working") return "online" as const
  if (status === "connecting") return "syncing" as const
  if (status === "error") return "error" as const
  return "offline" as const
}

export type ChatTheme = "aurora" | "unraid"

export function readChatTheme(): ChatTheme {
  return localStorage.getItem("unraid-codex.theme") === "unraid" ? "unraid" : "aurora"
}

const isCodexSettingsRoute = () =>
  /\/Settings\/CodexSettings\/?$/.test(window.location.pathname)

export function App({ rootElement }: { rootElement: HTMLElement }) {
  const {
    state,
    send,
    interrupt,
    answerRequest,
    rejectRequest,
    login,
    loginMcpServer,
    updateThreadSettings,
    saveMcpServer,
    removeMcpServer,
    installPlugin,
    uninstallPlugin,
    dismissNotice,
  } = useCodexAppServer()
  const [open, setOpen] = React.useState(isCodexSettingsRoute)
  const [docked, setDocked] = React.useState(
    () => localStorage.getItem("unraid-codex.docked") !== "false",
  )
  const [dockWidth, setDockWidth] = React.useState(() => {
    const stored = localStorage.getItem("unraid-codex.dock-width")
    const saved = stored == null ? Number.NaN : Number(stored)
    return Number.isFinite(saved) ? Math.min(900, Math.max(360, saved)) : 520
  })
  const [viewportWidth, setViewportWidth] = React.useState(() => window.innerWidth)
  const [theme, setTheme] = React.useState<ChatTheme>(readChatTheme)
  const [inspectorOpen, setInspectorOpen] = React.useState(isCodexSettingsRoute)
  const [permissionsOpen, setPermissionsOpen] = React.useState(false)
  const [prompt, setPrompt] = React.useState("")
  const [attachments, setAttachments] = React.useState<Attachment[]>([])
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const openSettings = () => {
      setOpen(true)
      setInspectorOpen(true)
    }
    window.addEventListener("unraid-codex:open-settings", openSettings)
    return () => window.removeEventListener("unraid-codex:open-settings", openSettings)
  }, [])

  React.useEffect(() => {
    rootElement.dataset.chatTheme = theme
    rootElement.classList.toggle("uc-theme-unraid", theme === "unraid")
    rootElement.classList.toggle("uc-theme-aurora", theme === "aurora")
    localStorage.setItem("unraid-codex.theme", theme)
  }, [rootElement, theme])

  React.useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  React.useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" })
  }, [state.items, state.requests, state.plan, state.diff, state.notices])

  React.useEffect(() => {
    if (state.requests.length) setOpen(true)
  }, [state.requests.length])

  React.useEffect(() => {
    const root = document.documentElement
    const active = open && docked && window.matchMedia("(min-width: 900px)").matches
    const width = Math.min(dockWidth, Math.max(360, viewportWidth - 420))
    const resizedElements = [
      document.body,
      document.querySelector<HTMLElement>("#header"),
      document.querySelector<HTMLElement>("#menu"),
      document.querySelector<HTMLElement>("#displaybox"),
      document.querySelector<HTMLElement>("#footer"),
    ].filter((element): element is HTMLElement => Boolean(element))
    const previous = resizedElements.map((element) => ({
      element,
      width: element.style.getPropertyValue("width"),
      priority: element.style.getPropertyPriority("width"),
      maxWidth: element.style.getPropertyValue("max-width"),
      maxWidthPriority: element.style.getPropertyPriority("max-width"),
    }))
    root.classList.toggle("unraid-codex-docked", active)
    root.style.setProperty("--unraid-codex-dock-width", `${width}px`)
    if (active) {
      document.body.style.setProperty("width", `calc(100vw - ${width}px)`, "important")
      document.body.style.setProperty("max-width", `calc(100vw - ${width}px)`, "important")
      for (const element of resizedElements.slice(1)) {
        const fixedFooter = element.id === "footer"
        element.style.setProperty(
          "width",
          fixedFooter ? `calc(100vw - ${width}px)` : "100%",
          "important",
        )
        element.style.setProperty(
          "max-width",
          fixedFooter ? `calc(100vw - ${width}px)` : "100%",
          "important",
        )
      }
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")))
    }
    localStorage.setItem("unraid-codex.docked", String(docked))
    localStorage.setItem("unraid-codex.dock-width", String(dockWidth))
    return () => {
      root.classList.remove("unraid-codex-docked")
      for (const entry of previous) {
        if (entry.width) {
          entry.element.style.setProperty("width", entry.width, entry.priority)
        } else {
          entry.element.style.removeProperty("width")
        }
        if (entry.maxWidth) {
          entry.element.style.setProperty("max-width", entry.maxWidth, entry.maxWidthPriority)
        } else {
          entry.element.style.removeProperty("max-width")
        }
      }
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")))
    }
  }, [dockWidth, docked, open, viewportWidth])

  React.useEffect(() => {
    if (!open || viewportWidth >= 900) return
    const previousOverflow = document.body.style.getPropertyValue("overflow")
    const previousOverscroll = document.body.style.getPropertyValue("overscroll-behavior")
    document.body.style.setProperty("overflow", "hidden", "important")
    document.body.style.setProperty("overscroll-behavior", "none", "important")
    return () => {
      if (previousOverflow) {
        document.body.style.setProperty("overflow", previousOverflow)
      } else {
        document.body.style.removeProperty("overflow")
      }
      if (previousOverscroll) {
        document.body.style.setProperty("overscroll-behavior", previousOverscroll)
      } else {
        document.body.style.removeProperty("overscroll-behavior")
      }
    }
  }, [open, viewportWidth])

  const beginResize = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.style.userSelect = "none"
  }, [])

  const resizeDock = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const maximum = Math.min(900, window.innerWidth - 420)
    setDockWidth(Math.min(maximum, Math.max(360, window.innerWidth - event.clientX)))
  }, [])

  const finishResize = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    document.body.style.removeProperty("user-select")
  }, [])

  const submit = React.useCallback(
    (value: string, submittedAttachments: Attachment[]) => {
      if (!value.trim()) return
      void send(value.trim(), submittedAttachments)
      setPrompt("")
      setAttachments([])
    },
    [send],
  )

  const currentModel =
    state.settings?.model ??
    state.config?.model ??
    state.models.find((model) => !model.hidden)?.model ??
    state.models.find((model) => !model.hidden)?.id ??
    "codex"
  const selectedModel = state.models.find(
    (model) => (model.model ?? model.id) === currentModel,
  )
  const effortOptions = (
    selectedModel?.supportedReasoningEfforts?.map(
      (option: Record<string, any>) =>
        option.reasoningEffort ?? option.effort ?? option.value,
    ) ?? ["minimal", "low", "medium", "high", "xhigh"]
  ).filter(Boolean)
  const currentEffort =
    state.settings?.effort ??
    state.config?.model_reasoning_effort ??
    effortOptions.find((option: string) => option === "medium") ??
    effortOptions[0]
  const currentPermissionProfile =
    state.settings?.activePermissionProfile?.id ??
    state.settings?.permissions ??
    state.config?.permission_profile ??
    state.permissionProfiles.find((entry) => entry.allowed !== false)?.id
  const currentApproval =
    typeof state.settings?.approvalPolicy === "string"
      ? state.settings.approvalPolicy
      : typeof state.config?.approval_policy === "string"
        ? state.config.approval_policy
        : "on-request"
  const permissionTools = PERMISSIONS.map((permission) => ({
    ...permission,
    state: currentApproval === "never" ? ("allow" as const) : ("ask" as const),
  }))

  return (
    <TooltipProvider delayDuration={250}>
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        {!open ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button
                  variant="neutral"
                  size="icon"
                  className={`uc-launcher uc-theme-${theme}`}
                  aria-label="Open Codex"
                >
                  <Bot size={22} strokeWidth={1.65} aria-hidden />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">Open Codex</TooltipContent>
          </Tooltip>
        ) : null}

        <SheetContent
          side="right"
          className={`uc-sheet uc-theme-${theme}`}
          data-chat-theme={theme}
          style={{ "--uc-dock-width": `${dockWidth}px` } as React.CSSProperties}
        >
          {docked ? (
            <div
              className="uc-resize-handle"
              role="separator"
              aria-label="Resize Codex panel"
              aria-orientation="vertical"
              aria-valuemin={360}
              aria-valuemax={900}
              aria-valuenow={dockWidth}
              tabIndex={0}
              onPointerDown={beginResize}
              onPointerMove={resizeDock}
              onPointerUp={finishResize}
              onPointerCancel={finishResize}
              onDoubleClick={() => setDockWidth(520)}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") setDockWidth((width) => Math.min(900, width + 20))
                if (event.key === "ArrowRight") setDockWidth((width) => Math.max(360, width - 20))
                if (event.key === "Home") setDockWidth(360)
                if (event.key === "End") setDockWidth(900)
              }}
            />
          ) : null}
          <SheetHeader className="uc-header">
            <div className="uc-brand">
              <span className="uc-mark">
                <Bot size={18} strokeWidth={1.65} aria-hidden />
              </span>
              <div className="uc-brand-copy">
                <SheetTitle className="aurora-text-section">Codex</SheetTitle>
                <SheetDescription className="aurora-text-meta">
                  Unraid
                </SheetDescription>
              </div>
            </div>
            <div className="uc-header-actions">
              <div className="uc-permission-menu">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <PermissionChip
                        tools={permissionTools}
                        iconOnly
                        onClick={() => setPermissionsOpen((current) => !current)}
                        className="uc-header-shield"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Session permissions</TooltipContent>
                </Tooltip>
                {permissionsOpen ? (
                  <div className="uc-header-popover">
                    <div>
                      <div className="aurora-text-label">Permission Profile</div>
                      <div className="aurora-text-meta">
                        Applies to subsequent turns in this session.
                      </div>
                    </div>
                    <Select
                      value={String(currentPermissionProfile ?? "")}
                      onValueChange={(permissions) => {
                        void updateThreadSettings({ permissions })
                        setPermissionsOpen(false)
                      }}
                    >
                      <SelectTrigger aria-label="Quick permission profile">
                        <SelectValue placeholder="Default profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.permissionProfiles
                          .filter((entry) => entry.allowed !== false)
                          .map((entry) => (
                            <SelectItem key={entry.id} value={entry.id}>
                              {entry.name ?? entry.id}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <div className="aurora-text-label">Approval Gate</div>
                      <div className="uc-approval-toggle">
                        {[
                          ["untrusted", "Strict"],
                          ["on-request", "Ask"],
                          ["never", "Allow"],
                        ].map(([value, label]) => (
                          <Button
                            key={value}
                            variant={currentApproval === value ? "aurora" : "neutral"}
                            size="sm"
                            onClick={() => {
                              void updateThreadSettings({ approvalPolicy: value })
                              setPermissionsOpen(false)
                            }}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="uc-dock-toggle"
                    aria-label={inspectorOpen ? "Back to conversation" : "Inspect session"}
                    onClick={() => setInspectorOpen((current) => !current)}
                  >
                    {inspectorOpen ? (
                      <ArrowLeft size={17} aria-hidden />
                    ) : (
                      <SlidersHorizontal size={17} aria-hidden />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {inspectorOpen ? "Back to conversation" : "Inspect session"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="uc-dock-toggle"
                    aria-label={docked ? "Undock Codex" : "Dock Codex to the right"}
                    onClick={() => setDocked((current) => !current)}
                  >
                    {docked ? (
                      <PanelRightClose size={17} aria-hidden />
                    ) : (
                      <PanelRightOpen size={17} aria-hidden />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {docked ? "Use as overlay" : "Dock to the right"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="uc-connection">
                    <StatusIndicator
                      tone={connectionTone(state.status)}
                      label={state.statusText}
                      showLabel={false}
                      pulse={state.status === "connecting" || state.status === "working"}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">{state.statusText}</TooltipContent>
              </Tooltip>
            </div>
          </SheetHeader>

          <SheetBody className="uc-conversation-shell">
            {inspectorOpen ? (
              <div className="uc-inspector">
                <div className="uc-inspector-heading">
                  <div className="aurora-text-section">Session Inspector</div>
                  <div className="aurora-text-meta">
                    Runtime inventory and policy for the active Codex session.
                  </div>
                </div>
                <div className="uc-theme-setting">
                  <div>
                    <div className="aurora-text-label">Chat Theme</div>
                    <div className="aurora-text-meta">
                      Switch the complete token and component treatment.
                    </div>
                  </div>
                  <Select
                    value={theme}
                    onValueChange={(value) => setTheme(value as ChatTheme)}
                  >
                    <SelectTrigger aria-label="Chat theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aurora">Aurora Light</SelectItem>
                      <SelectItem value="unraid">Unraid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <SessionContextRenderer
                  state={state}
                  onMcpLogin={(name) => void loginMcpServer(name)}
                  onUpdateSettings={(settings) => void updateThreadSettings(settings)}
                  onSaveMcpServer={(definition) => saveMcpServer(definition)}
                  onRemoveMcpServer={(name) => removeMcpServer(name)}
                  onInstallPlugin={(plugin) => installPlugin(plugin)}
                  onUninstallPlugin={(plugin) => uninstallPlugin(plugin)}
                />
              </div>
            ) : (
              <Conversation
                ref={scrollRef}
                className="uc-conversation"
                maxHeight={Number.MAX_SAFE_INTEGER}
                style={{
                  height: "100%",
                  maxHeight: "none",
                  border: 0,
                  borderRadius: 0,
                  boxShadow: "none",
                }}
              >
            {!state.authenticated ? (
              <Banner
                variant="info"
                title="Sign in to Codex"
                description="Use your ChatGPT account in this isolated container."
                action={
                  <Button variant="aurora" size="sm" onClick={() => void login()}>
                    Sign In
                  </Button>
                }
              />
            ) : null}

            {state.deviceLogin ? (
              <div className="uc-device-login">
                <div className="aurora-text-label">Device Code</div>
                <div className="uc-device-code">{state.deviceLogin.userCode}</div>
                <Button
                  variant="aurora"
                  size="sm"
                  onClick={() =>
                    window.open(state.deviceLogin?.verificationUrl, "_blank", "noopener")
                  }
                >
                  Open Sign-In Page
                </Button>
              </div>
            ) : null}

            {state.notices.map((notice) => (
              <Banner
                key={notice.id}
                variant={notice.tone}
                title={notice.title}
                description={notice.description}
                onDismiss={() => dismissNotice(notice.id)}
              />
            ))}

            {!state.items.length &&
            !state.requests.length &&
            !state.plan &&
            !state.diff ? (
              <div className="uc-empty">
                <span className="uc-empty-mark">
                  <MessageSquare size={22} strokeWidth={1.65} aria-hidden />
                </span>
                <div className="aurora-text-section">Codex is ready.</div>
                <div className="aurora-text-body uc-muted">
                  Ask about the server, inspect a workspace, or start a development task.
                </div>
              </div>
            ) : null}

            <TimelineRenderer entries={state.items} theme={theme} skills={state.skills} />

            {state.plan ? (
              <PlanRenderer plan={state.plan} streaming={Boolean(state.activeTurnId)} />
            ) : null}

            {state.diff ? (
              <CodeBlock
                code={state.diff}
                language="diff"
                filename="Current Turn Diff"
                showLineNumbers
                variant="diff"
              />
            ) : null}

            {state.requests.map((request) => (
              <RequestRenderer
                key={String(request.id)}
                request={request}
                answer={(result) => answerRequest(request, result)}
                reject={(message) => rejectRequest(request, message)}
              />
            ))}
              </Conversation>
            )}
          </SheetBody>

          {!inspectorOpen ? <SheetFooter className="uc-footer">
            {state.tokenUsage ? <ContextRenderer tokenUsage={state.tokenUsage} /> : null}
            <div className="uc-prompt">
              <PromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={submit}
              onStop={() => void interrupt()}
              attachments={attachments}
              onAddAttachment={(attachment) =>
                setAttachments((current) => [...current, attachment])
              }
              onRemoveAttachment={(id) =>
                setAttachments((current) =>
                  current.filter((attachment) => attachment.id !== id),
                )
              }
              model={String(currentModel)}
              onModelChange={(model) => void updateThreadSettings({ model })}
              models={
                state.models.length
                  ? state.models
                      .filter((model) => !model.hidden)
                      .map((model) => ({
                        id: model.model ?? model.id,
                        label: model.displayName ?? model.model ?? model.id,
                      }))
                  : [{ id: "codex", label: "Codex" }]
              }
              isStreaming={Boolean(state.activeTurnId)}
              placeholder={theme === "unraid" ? "Ask Codex about your server…" : "Ask Codex…"}
              toolbarStart={
                <Select
                  value={String(currentEffort)}
                  onValueChange={(effort) => void updateThreadSettings({ effort })}
                >
                  <SelectTrigger
                    className="uc-effort-select"
                    aria-label="Quick reasoning effort"
                  >
                    <SelectValue placeholder="Effort" />
                  </SelectTrigger>
                  <SelectContent>
                    {effortOptions.map((effort: string) => (
                      <SelectItem key={effort} value={effort}>
                        {effort.charAt(0).toUpperCase() + effort.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
              slashCommands={[
                { id: "review", label: "/review", description: "Review workspace changes" },
                { id: "plan", label: "/plan", description: "Create an implementation plan" },
                { id: "status", label: "/status", description: "Inspect the current environment" },
              ]}
              mentionItems={[
                { id: "workspace", label: "/workspace", kind: "folder" },
                { id: "instructions", label: "AGENTS.md", kind: "file" },
              ]}
              showSlashButton={false}
              showMentionButton={false}
              />
            </div>
          </SheetFooter> : null}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
