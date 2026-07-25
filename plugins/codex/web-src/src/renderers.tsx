import * as React from "react"
import {
  Activity,
  BookOpenCheck,
  Check,
  ChevronRight,
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react"
import { Action } from "@/components/aurora/ai/action"
import { Actions } from "@/components/aurora/ai/actions"
import { Agent } from "@/components/aurora/ai/agent"
import { Checkpoint } from "@/components/aurora/ai/checkpoint"
import { Context } from "@/components/aurora/ai/context"
import { Image as AuroraImage } from "@/components/aurora/ai/image"
import {
  Message,
  MessageContent,
} from "@/components/aurora/ai/message"
import { Plan } from "@/components/aurora/ai/plan"
import { Reasoning } from "@/components/aurora/ai/reasoning"
import { Response } from "@/components/aurora/ai/response"
import { AskUserQuestion } from "@/components/aurora/ask-user-question"
import { CodeBlock } from "@/components/aurora/code-block"
import { PermissionPrompt } from "@/components/aurora/permission-prompt"
import { Terminal, type TerminalLine } from "@/components/aurora/terminal"
import { ToolCalls, type ToolCall } from "@/components/aurora/tool-calls"
import { Banner } from "@/components/ui/aurora/banner"
import { Badge } from "@/components/ui/aurora/badge"
import { Button } from "@/components/ui/aurora/button"
import { Collapsible } from "@/components/ui/aurora/collapsible"
import {
  DescriptionItem,
  DescriptionList,
} from "@/components/ui/aurora/description-list"
import { Input } from "@/components/ui/aurora/input"
import { Progress } from "@/components/ui/aurora/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/aurora/select"
import type {
  JsonObject,
  ServerRequest,
  TimelineItem,
} from "@/protocol"

function formatJson(value: unknown): string {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function compactValue(value: unknown): string {
  if (value == null) return "Not set"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (Array.isArray(value)) return value.map(compactValue).join(", ")
  const enabled = Object.entries(value as JsonObject)
    .filter(([, entry]) => entry === true)
    .map(([key]) => key)
  return enabled.length ? enabled.join(", ") : formatJson(value)
}

function humanizeStatus(value: unknown): string {
  const raw = compactValue(value)
  return raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase())
}

function InventoryBadges({ values }: { values: string[] }) {
  return (
    <span className="uc-badge-list">
      {values.map((value) => (
        <Badge key={value} tone="neutral" fill="outline" size="sm">
          {value}
        </Badge>
      ))}
    </span>
  )
}

interface McpEditorValue {
  name: string
  previousName?: string
  config: JsonObject
}

function McpServerManager({
  config,
  servers,
  onLogin,
  onSave,
  onRemove,
}: {
  config: JsonObject
  servers: JsonObject[]
  onLogin?: (name: string) => void
  onSave?: (definition: McpEditorValue) => Promise<unknown>
  onRemove?: (name: string) => Promise<unknown>
}) {
  const configured = config.mcp_servers ?? {}
  const [editing, setEditing] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<JsonObject | null>(null)
  const [busy, setBusy] = React.useState(false)
  const names = Array.from(
    new Set([...Object.keys(configured), ...servers.map((server) => server.name)]),
  ).sort()

  const beginEdit = (name?: string) => {
    const current = name ? configured[name] ?? {} : {}
    setEditing(name ?? "")
    setDraft({
      name: name ?? "",
      transport: current.url ? "http" : "stdio",
      url: current.url ?? "",
      command: current.command ?? "",
      args: (current.args ?? []).join(" "),
      enabled: current.enabled !== false,
      original: current,
    })
  }

  const save = async () => {
    if (!draft?.name?.trim() || !onSave) return
    const next = { ...(draft.original ?? {}) }
    delete next.url
    delete next.command
    delete next.args
    next.enabled = draft.enabled !== false
    if (draft.transport === "http") {
      next.url = draft.url.trim()
    } else {
      next.command = draft.command.trim()
      next.args = String(draft.args ?? "")
        .split(/\s+/)
        .filter(Boolean)
    }
    setBusy(true)
    try {
      await onSave({
        name: draft.name.trim(),
        previousName: editing || undefined,
        config: next,
      })
      setEditing(null)
      setDraft(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="uc-manager">
      <div className="uc-manager-toolbar">
        <div className="aurora-text-meta">
          Add or edit user-configured STDIO and HTTP servers. Plugin-managed servers remain read-only.
        </div>
        <Button variant="aurora" size="sm" onClick={() => beginEdit()}>
          <Plus size={14} aria-hidden />
          Add Server
        </Button>
      </div>
      {draft ? (
        <div className="uc-editor-card">
          <div className="uc-editor-grid">
            <label className="uc-field">
              <span className="aurora-text-label">Name</span>
              <Input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="context7"
              />
            </label>
            <label className="uc-field">
              <span className="aurora-text-label">Transport</span>
              <Select
                value={draft.transport}
                onValueChange={(transport) => setDraft({ ...draft, transport })}
              >
                <SelectTrigger aria-label="MCP transport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">Streamable HTTP</SelectItem>
                  <SelectItem value="stdio">STDIO</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          {draft.transport === "http" ? (
            <label className="uc-field">
              <span className="aurora-text-label">Server URL</span>
              <Input
                value={draft.url}
                onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                placeholder="https://example.com/mcp"
              />
            </label>
          ) : (
            <div className="uc-editor-grid">
              <label className="uc-field">
                <span className="aurora-text-label">Command</span>
                <Input
                  value={draft.command}
                  onChange={(event) => setDraft({ ...draft, command: event.target.value })}
                  placeholder="npx"
                />
              </label>
              <label className="uc-field">
                <span className="aurora-text-label">Arguments</span>
                <Input
                  value={draft.args}
                  onChange={(event) => setDraft({ ...draft, args: event.target.value })}
                  placeholder="-y @scope/server"
                />
              </label>
            </div>
          )}
          <div className="uc-editor-actions">
            <Button
              variant={draft.enabled === false ? "neutral" : "aurora"}
              size="sm"
              onClick={() => setDraft({ ...draft, enabled: draft.enabled === false })}
            >
              {draft.enabled === false ? "Disabled" : "Enabled"}
            </Button>
            <span className="uc-spacer" />
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              variant="aurora"
              size="sm"
              disabled={
                busy ||
                !draft.name?.trim() ||
                (draft.transport === "http" ? !draft.url?.trim() : !draft.command?.trim())
              }
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save Server"}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="uc-catalog-grid">
        {names.map((name) => {
          const definition = configured[name]
          const server = servers.find((entry) => entry.name === name) ?? {}
          const tools = Object.keys(server.tools ?? {})
          const failed = server.startupStatus === "failed" || Boolean(server.startupError)
          return (
            <div className="uc-catalog-card" key={name}>
              <div className="uc-inventory-heading">
                <strong>{name}</strong>
                <Badge tone={failed ? "error" : definition?.enabled === false ? "neutral" : "success"} dot size="sm">
                  {failed ? "Failed" : definition?.enabled === false ? "Disabled" : humanizeStatus(server.authStatus ?? "ready")}
                </Badge>
              </div>
              <div className="aurora-text-meta">
                {definition?.url ? "HTTP" : definition?.command ? "STDIO" : "Plugin managed"} ·{" "}
                {tools.length} tools · {(server.resources ?? []).length} resources
              </div>
              {server.startupError ? (
                <div className="aurora-text-meta uc-error-text">{server.startupError}</div>
              ) : null}
              {tools.length ? <InventoryBadges values={tools.slice(0, 10)} /> : null}
              <div className="uc-card-actions">
                {server.authStatus === "notLoggedIn" && onLogin ? (
                  <Button variant="neutral" size="sm" onClick={() => onLogin(name)}>
                    Sign In
                  </Button>
                ) : null}
                {definition ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => beginEdit(name)}>
                      <Pencil size={13} aria-hidden />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Remove MCP server "${name}"?`)) {
                          void onRemove?.(name)
                        }
                      }}
                    >
                      <Trash2 size={13} aria-hidden />
                      Remove
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          )
        })}
        {!names.length ? (
          <div className="aurora-text-meta">No MCP servers configured.</div>
        ) : null}
      </div>
    </div>
  )
}

function PluginCatalog({
  plugins,
  apps,
  onInstall,
  onUninstall,
}: {
  plugins: JsonObject[]
  apps: JsonObject[]
  onInstall?: (plugin: JsonObject) => Promise<unknown>
  onUninstall?: (plugin: JsonObject) => Promise<unknown>
}) {
  const [view, setView] = React.useState<"installed" | "available" | "apps">("installed")
  const [query, setQuery] = React.useState("")
  const [visible, setVisible] = React.useState(12)
  const [busy, setBusy] = React.useState<string | null>(null)
  React.useEffect(() => setVisible(12), [query, view])

  const normalized = query.trim().toLowerCase()
  const candidates =
    view === "apps"
      ? apps
      : plugins.filter((plugin) => (view === "installed" ? plugin.installed : !plugin.installed))
  const filtered = candidates.filter((entry) =>
    [entry.name, entry.description, entry.summary, ...(entry.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  )

  const runPluginAction = async (plugin: JsonObject) => {
    setBusy(plugin.id)
    try {
      if (plugin.installed) await onUninstall?.(plugin)
      else await onInstall?.(plugin)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="uc-manager">
      <div className="uc-catalog-controls">
        <div className="uc-filter-group" role="group" aria-label="Plugin catalog view">
          {[
            ["installed", `Installed ${plugins.filter((plugin) => plugin.installed).length}`],
            ["available", `Available ${plugins.filter((plugin) => !plugin.installed).length}`],
            ["apps", `Apps ${apps.length}`],
          ].map(([id, label]) => (
            <Button
              key={id}
              variant={view === id ? "aurora" : "neutral"}
              size="sm"
              onClick={() => setView(id as typeof view)}
            >
              {label}
            </Button>
          ))}
        </div>
        <label className="uc-search">
          <Search size={14} aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${view}`}
            aria-label={`Search ${view}`}
          />
        </label>
      </div>
      <div className="uc-catalog-grid">
        {filtered.slice(0, visible).map((entry) => (
          <div className="uc-catalog-card" key={`${view}-${entry.id}`}>
            <div className="uc-inventory-heading">
              <strong>{entry.name}</strong>
              <Badge
                tone={
                  view === "apps"
                    ? entry.isAccessible && entry.isEnabled
                      ? "success"
                      : "neutral"
                    : entry.installed
                      ? "success"
                      : "info"
                }
                size="sm"
              >
                {view === "apps"
                  ? entry.isAccessible && entry.isEnabled
                    ? "ready"
                    : "unavailable"
                  : entry.installed
                    ? "installed"
                    : "available"}
              </Badge>
            </div>
            <div className="aurora-text-meta uc-clamp">
              {entry.description ??
                entry.summary ??
                [entry.marketplaceName, entry.localVersion ?? entry.version]
                  .filter(Boolean)
                  .join(" · ") ??
                "No description provided."}
            </div>
            {entry.keywords?.length ? (
              <InventoryBadges values={entry.keywords.slice(0, 5)} />
            ) : null}
            <div className="uc-card-actions">
              {view === "apps" ? (
                !entry.isAccessible && entry.installUrl ? (
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => window.open(entry.installUrl, "_blank", "noopener,noreferrer")}
                  >
                    Connect
                  </Button>
                ) : null
              ) : (
                <Button
                  variant={entry.installed ? "ghost" : "aurora"}
                  size="sm"
                  disabled={busy === entry.id}
                  onClick={() => void runPluginAction(entry)}
                >
                  {busy === entry.id
                    ? "Working…"
                    : entry.installed
                      ? "Remove"
                      : "Install"}
                </Button>
              )}
            </div>
          </div>
        ))}
        {!filtered.length ? (
          <div className="aurora-text-meta">No matching {view}.</div>
        ) : null}
      </div>
      {visible < filtered.length ? (
        <Button variant="neutral" size="sm" onClick={() => setVisible((count) => count + 12)}>
          Show 12 More
        </Button>
      ) : null}
    </div>
  )
}

export function SessionContextRenderer({
  state,
  onMcpLogin,
  onUpdateSettings,
  onSaveMcpServer,
  onRemoveMcpServer,
  onInstallPlugin,
  onUninstallPlugin,
}: {
  state: {
    thread: JsonObject | null
    settings: JsonObject | null
    config: JsonObject | null
    models: JsonObject[]
    skills: JsonObject[]
    mcpServers: JsonObject[]
    goal: JsonObject | null
    rateLimits: JsonObject | null
    permissionProfiles: JsonObject[]
    hooks: JsonObject[]
    apps: JsonObject[]
    plugins: JsonObject[]
    marketplaceErrors: JsonObject[]
    events: Array<{ method: string; params: JsonObject; at: number }>
    items: TimelineItem[]
  }
  onMcpLogin?: (name: string) => void
  onUpdateSettings?: (settings: JsonObject) => void
  onSaveMcpServer?: (definition: McpEditorValue) => Promise<unknown>
  onRemoveMcpServer?: (name: string) => Promise<unknown>
  onInstallPlugin?: (plugin: JsonObject) => Promise<unknown>
  onUninstallPlugin?: (plugin: JsonObject) => Promise<unknown>
}) {
  const config = state.config ?? {}
  const settings = state.settings ?? {}
  const visibleModels = state.models.filter((model) => !model.hidden)
  const configuredModel = settings.model ?? config.model
  const currentModel =
    visibleModels.some((model) => (model.model ?? model.id) === configuredModel)
      ? configuredModel
      : visibleModels[0]?.model ?? visibleModels[0]?.id ?? "codex"
  const selectedModel = state.models.find(
    (model) => (model.model ?? model.id) === currentModel,
  )
  const effortOptions =
    selectedModel?.supportedReasoningEfforts?.map(
      (option: JsonObject) => option.reasoningEffort ?? option.effort ?? option.value,
    ).filter(Boolean) ?? ["minimal", "low", "medium", "high", "xhigh"]
  const configuredEffort = settings.effort ?? config.model_reasoning_effort
  const effort = effortOptions.includes(configuredEffort)
    ? configuredEffort
    : effortOptions.find((option: string) => option === "medium") ?? effortOptions[0]
  const approval =
    settings.approvalPolicy ?? config.approval_policy ?? config.approvalPolicy ?? "ask"
  const sandbox =
    settings.sandboxPolicy ?? config.sandbox_mode ?? config.sandboxMode ?? "danger-full-access"
  const profile =
    settings.activePermissionProfile?.name ??
    settings.activePermissionProfile?.id ??
    config.permission_profile ??
    "Default"
  const configuredTools = Object.entries(config.tools ?? {})
    .filter(([, enabled]) => enabled !== false)
    .map(([name]) => name)
  const agents = state.items.filter((entry) =>
    ["collabAgentToolCall", "subAgentActivity"].includes(entry.item.type),
  )
  const rateWindow = state.rateLimits?.primary
  const goalPercent =
    state.goal?.tokenBudget && state.goal.tokenBudget > 0
      ? Math.min(100, Math.round((state.goal.tokensUsed / state.goal.tokenBudget) * 100))
      : null

  return (
    <div className="uc-session-context">
      <DescriptionList className="uc-session-summary">
        <DescriptionItem
          label="Model"
          value={
            <Select
              value={String(currentModel)}
              onValueChange={(model) => onUpdateSettings?.({ model })}
            >
              <SelectTrigger className="uc-setting-select" aria-label="Session model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {visibleModels.map((model) => (
                  <SelectItem
                    key={model.model ?? model.id}
                    value={model.model ?? model.id}
                  >
                    {model.displayName ?? model.model ?? model.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          active
        />
        <DescriptionItem
          label="Reasoning Effort"
          value={
            <Select
              value={String(effort)}
              onValueChange={(nextEffort) => onUpdateSettings?.({ effort: nextEffort })}
            >
              <SelectTrigger className="uc-setting-select" aria-label="Reasoning effort">
                <SelectValue placeholder="Select effort" />
              </SelectTrigger>
              <SelectContent>
                {effortOptions.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <DescriptionItem
          label="Permissions"
          value={`${compactValue(approval)} · ${compactValue(sandbox)} · ${profile}`}
        />
        <DescriptionItem
          label="Workspace"
          value={settings.cwd ?? state.thread?.cwd ?? "/workspace"}
        />
      </DescriptionList>

      {state.goal ? (
        <Collapsible
          title={
            <span className="uc-collapsible-title">
              Goal
              <Badge tone={state.goal.status === "blocked" ? "warn" : "info"} size="sm">
                {state.goal.status}
              </Badge>
            </span>
          }
          defaultOpen
        >
          <div className="uc-inventory-detail">
            <div className="aurora-text-body">{state.goal.objective}</div>
            {goalPercent != null ? (
              <Progress
                value={state.goal.tokensUsed}
                max={state.goal.tokenBudget}
                showLabel
                label={`${state.goal.tokensUsed.toLocaleString()} / ${state.goal.tokenBudget.toLocaleString()} tokens`}
                size="sm"
              />
            ) : (
              <div className="aurora-text-meta">
                {Number(state.goal.tokensUsed ?? 0).toLocaleString()} tokens used
              </div>
            )}
          </div>
        </Collapsible>
      ) : null}

      <Collapsible
        title={
          <span className="uc-collapsible-title">
            MCP Servers & Tools
            <Badge tone="info" size="sm">{state.mcpServers.length}</Badge>
          </span>
        }
      >
        <McpServerManager
          config={config}
          servers={state.mcpServers}
          onLogin={onMcpLogin}
          onSave={onSaveMcpServer}
          onRemove={onRemoveMcpServer}
        />
      </Collapsible>

      <Collapsible
        title={
          <span className="uc-collapsible-title">
            Apps & Plugins
            <Badge tone="info" size="sm">
              {state.apps.length + state.plugins.length}
            </Badge>
          </span>
        }
      >
        <PluginCatalog
          plugins={state.plugins}
          apps={state.apps}
          onInstall={onInstallPlugin}
          onUninstall={onUninstallPlugin}
        />
        {state.marketplaceErrors.map((error, index) => (
          <Banner
            key={`marketplace-error-${index}`}
            variant="warn"
            title="Plugin marketplace unavailable"
            description={error.message ?? formatJson(error)}
          />
        ))}
      </Collapsible>

      <Collapsible
        title={
          <span className="uc-collapsible-title">
            Skills
            <Badge tone="info" size="sm">{state.skills.length}</Badge>
          </span>
        }
      >
        <div className="uc-inventory-list">
          {state.skills.length ? state.skills.map((skill) => (
            <div className="uc-inventory-row" key={`${skill.name}-${skill.path}`}>
              <div className="uc-inventory-heading">
                <strong>{skill.name}</strong>
                <Badge tone={skill.enabled ? "success" : "neutral"} size="sm">
                  {skill.enabled ? compactValue(skill.scope) : "disabled"}
                </Badge>
              </div>
              <div className="aurora-text-meta">
                {skill.shortDescription ?? skill.interface?.short_description ?? skill.description}
              </div>
            </div>
          )) : <div className="aurora-text-meta">No skills discovered for this workspace.</div>}
        </div>
      </Collapsible>

      <Collapsible
        title={
          <span className="uc-collapsible-title">
            Runtime
            <Badge tone="neutral" size="sm">
              {state.models.length} models
            </Badge>
          </span>
        }
      >
        <DescriptionList className="uc-runtime-list">
          <DescriptionItem
            label="Models"
            value={<InventoryBadges values={state.models.map((model) => model.id ?? model.model ?? model.slug).filter(Boolean)} />}
          />
          <DescriptionItem
            label="Tools"
            value={configuredTools.length ? <InventoryBadges values={configuredTools} /> : "App-server defaults"}
          />
          <DescriptionItem
            label="Profiles"
            value={
              state.permissionProfiles.length ? (
                <Select
                  value={
                    settings.activePermissionProfile?.id ??
                    config.permission_profile ??
                    state.permissionProfiles.find((entry) => entry.allowed !== false)?.id
                  }
                  onValueChange={(permissions) =>
                    onUpdateSettings?.({ permissions })
                  }
                >
                  <SelectTrigger aria-label="Permission profile">
                    <SelectValue />
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
              ) : (
                "Default"
              )
            }
          />
          <DescriptionItem
            label="Personality"
            value={
              <Select
                value={settings.personality ?? config.personality ?? "none"}
                onValueChange={(personality) =>
                  onUpdateSettings?.({ personality })
                }
              >
                <SelectTrigger aria-label="Personality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="pragmatic">Pragmatic</SelectItem>
                </SelectContent>
              </Select>
            }
          />
          <DescriptionItem
            label="Hooks"
            value={state.hooks.length
              ? <InventoryBadges values={state.hooks.map((hook) => `${hook.eventName}${hook.enabled ? "" : " (off)"}`)} />
              : "None configured"}
          />
          <DescriptionItem
            label="Agents"
            value={agents.length ? `${agents.length} agent activities in this session` : "No delegated agents yet"}
          />
        </DescriptionList>
      </Collapsible>

      {rateWindow ? (
        <Collapsible title="Account Usage">
          <Progress
            value={rateWindow.usedPercent}
            showLabel
            label={`${Math.round(rateWindow.usedPercent)}% used · ${state.rateLimits?.planType ?? "account plan"}`}
            variant={rateWindow.usedPercent >= 90 ? "warn" : "default"}
          />
        </Collapsible>
      ) : null}

      <Collapsible
        title={
          <span className="uc-collapsible-title">
            Diagnostics
            <Badge
              tone={
                state.events.some((event) =>
                  /(error|warning|failed|deprecation|configWarning)/i.test(event.method),
                )
                  ? "warn"
                  : "success"
              }
              size="sm"
            >
              {state.events.filter((event) =>
                /(error|warning|failed|deprecation|configWarning)/i.test(event.method),
              ).length}{" "}
              issues
            </Badge>
          </span>
        }
      >
        <div className="uc-diagnostics">
          <div className="uc-diagnostic-summary">
            <Activity size={15} strokeWidth={1.65} aria-hidden />
            <div>
              <div className="aurora-text-label">App-Server Health</div>
              <div className="aurora-text-meta">
                Lifecycle events are summarized here. Raw protocol payloads stay in the developer log.
              </div>
            </div>
          </div>
          <div className="uc-protocol-events">
            {state.events
              .filter((event) =>
                /(error|warning|failed|deprecation|configWarning)/i.test(event.method),
              )
              .slice(-8)
              .reverse()
              .map((event, index) => (
                <div className="uc-protocol-event" key={`${event.at}-${event.method}-${index}`}>
                  <code>{event.method}</code>
                  <time dateTime={new Date(event.at).toISOString()}>
                    {new Date(event.at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                  {Object.keys(event.params).length ? (
                    <details>
                      <summary>Details</summary>
                      <pre>{formatJson(event.params)}</pre>
                    </details>
                  ) : null}
                </div>
              ))}
            {!state.events.some((event) =>
              /(error|warning|failed|deprecation|configWarning)/i.test(event.method),
            ) ? (
              <div className="aurora-text-meta">No warnings or failures in this session.</div>
            ) : null}
          </div>
          <details className="uc-developer-log">
            <summary>Developer Event Log · {state.events.length} events</summary>
            <div className="uc-protocol-events">
              {state.events.slice(-20).reverse().map((event, index) => (
                <div className="uc-protocol-event" key={`${event.at}-${event.method}-raw-${index}`}>
                  <code>{event.method}</code>
                  <time>{new Date(event.at).toLocaleTimeString()}</time>
                  {Object.keys(event.params).length ? (
                    <details>
                      <summary>Payload</summary>
                      <pre>{formatJson(event.params)}</pre>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        </div>
      </Collapsible>
    </div>
  )
}

function contentText(content: JsonObject[] = []): string {
  return content
    .filter((entry) => entry.type === "text" || entry.type === "inputText")
    .map((entry) => entry.text ?? "")
    .join("\n")
}

function resultText(item: JsonObject): string {
  if (item.error) return formatJson(item.error)
  if (item.result?.structuredContent) return formatJson(item.result.structuredContent)
  if (item.result?.content) {
    return item.result.content
      .map((entry: JsonObject) => entry.text ?? entry.content ?? formatJson(entry))
      .join("\n")
  }
  if (item.contentItems) {
    return item.contentItems
      .map((entry: JsonObject) => entry.text ?? entry.imageUrl ?? entry.audioUrl ?? "")
      .join("\n")
  }
  return ""
}

function terminalLines(item: JsonObject): TerminalLine[] {
  const lines: TerminalLine[] = [{ text: `$ ${item.command}`, type: "command" }]
  if (item.aggregatedOutput) {
    lines.push(
      ...String(item.aggregatedOutput)
        .split("\n")
        .map((text) => ({
          text,
          type: item.exitCode && item.exitCode !== 0 ? ("error" as const) : ("output" as const),
        })),
    )
  }
  if (item.status === "failed" && !item.aggregatedOutput) {
    lines.push({ text: `Command failed${item.exitCode == null ? "" : ` with exit code ${item.exitCode}`}`, type: "error" })
  }
  return lines
}

function UnraidTerminalItem({ entry }: { entry: TimelineItem }) {
  const item = entry.item
  const [copied, setCopied] = React.useState(false)
  const copyCommand = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(item.command ?? "")
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }, [item.command])
  const complete = entry.completedAtMs != null
  const failed = item.status === "failed" || (item.exitCode != null && item.exitCode !== 0)

  return (
    <section className="uc-unraid-terminal" aria-label="Command output">
      <div className="uc-unraid-terminal-head">
        <span className="uc-unraid-terminal-kind">EXEC</span>
        <code title={item.command}>{item.command}</code>
        <span
          className={`uc-unraid-terminal-exit ${failed ? "is-error" : ""}`}
        >
          {complete
            ? `exit ${item.exitCode ?? (failed ? 1 : 0)}`
            : "running"}
        </span>
        <Button
          variant="plain"
          size="unstyled"
          className="uc-unraid-terminal-copy"
          onClick={() => void copyCommand()}
          aria-label={copied ? "Copied command" : "Copy command"}
        >
          {copied ? "copied" : "copy"}
        </Button>
      </div>
      <pre>{item.aggregatedOutput || (complete ? "No output" : "Running…")}</pre>
    </section>
  )
}

function UnraidReasoningItem({ entry }: { entry: TimelineItem }) {
  const item = entry.item
  const summary = [...(item.summary ?? []), ...(item.content ?? [])]
    .filter(Boolean)
    .join("\n\n")
  const preview =
    String(item.summary?.[0] ?? item.content?.[0] ?? "Working through the request")
      .replace(/\s+/g, " ")
      .trim()

  return (
    <details className="uc-unraid-thinking" open={!entry.completedAtMs}>
      <summary>
        <ChevronRight size={13} strokeWidth={1.7} aria-hidden />
        <span>Thinking</span>
        <span aria-hidden>—</span>
        <em>{preview}</em>
      </summary>
      <div>{summary}</div>
    </details>
  )
}

function mappedToolCall(entry: TimelineItem): ToolCall {
  const item = entry.item
  const failed = item.status === "failed" || item.status === "error" || Boolean(item.error)
  const completed =
    entry.completedAtMs != null ||
    ["completed", "success", "failed", "error"].includes(item.status)
  return {
    id: item.id,
    tool:
      item.type === "mcpToolCall"
        ? `${item.server}.${item.tool}`
        : item.type === "dynamicToolCall"
          ? [item.namespace, item.tool].filter(Boolean).join(".")
          : item.type === "webSearch"
            ? "web.search"
            : item.tool ?? item.type,
    args: item.arguments ?? (item.query ? { query: item.query } : {}),
    status: failed ? "error" : completed ? "completed" : "running",
    result: entry.progress
      ? [entry.progress, resultText(item)].filter(Boolean).join("\n")
      : resultText(item),
    startedAt: entry.startedAtMs ? new Date(entry.startedAtMs) : undefined,
    completedAt: entry.completedAtMs ? new Date(entry.completedAtMs) : undefined,
  }
}

function MessageItem({ entry }: { entry: TimelineItem }) {
  const item = entry.item
  const user = item.type === "userMessage"
  const markdown = user ? contentText(item.content) : item.text ?? ""
  const [copied, setCopied] = React.useState(false)
  const copyMessage = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }, [markdown])
  const timestamp = entry.completedAtMs ?? entry.startedAtMs
  return (
    <Message
      role={user ? "user" : "assistant"}
      time={
        timestamp
          ? new Date(timestamp).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : undefined
      }
      actions={
        markdown ? (
          <Actions>
            <Action
              size="sm"
              aria-label={copied ? "Copied message" : "Copy message"}
              title={copied ? "Copied" : "Copy"}
              onClick={() => void copyMessage()}
            >
              {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
            </Action>
          </Actions>
        ) : undefined
      }
    >
      <MessageContent
        tone={user ? "user" : "assistant"}
        streaming={!user && !entry.completedAtMs}
        className={user ? "uc-message-content uc-message-user" : "uc-message-content uc-message-assistant"}
      >
        <Response markdown={markdown} streaming={!user && !entry.completedAtMs} />
      </MessageContent>
    </Message>
  )
}

function PlanItem({ entry }: { entry: TimelineItem }) {
  return (
    <Plan
      title="Plan"
      steps={[
        {
          label: entry.item.text || "Building a plan",
          status: entry.completedAtMs ? "done" : "inprog",
        },
      ]}
      isStreaming={!entry.completedAtMs}
    />
  )
}

function FileChangeItem({ entry }: { entry: TimelineItem }) {
  const changes = entry.item.changes ?? []
  if (!changes.length) {
    return (
      <Banner
        variant="info"
        title="Preparing file changes"
        description="Codex is building the patch."
      />
    )
  }
  return (
    <div className="uc-stack">
      {changes.map((change: JsonObject, index: number) => (
        <CodeBlock
          key={`${change.path}-${index}`}
          code={change.diff ?? ""}
          language="diff"
          filename={change.path}
          showLineNumbers
        />
      ))}
    </div>
  )
}

function CollabItem({ entry }: { entry: TimelineItem }) {
  const item = entry.item
  const states = Object.values(item.agentsStates ?? {}) as JsonObject[]
  const state = states.at(0)
  const status =
    item.status === "failed" || state?.status === "failed"
      ? "blocked"
      : entry.completedAtMs
        ? "completed"
        : "running"
  return (
    <Agent
      name={item.tool ?? "Collaborating Agent"}
      role={item.prompt ?? "Working on a delegated task"}
      status={status}
      model={item.model ?? undefined}
      task={state?.message ?? undefined}
      badge
    />
  )
}

function ImageItem({ entry }: { entry: TimelineItem }) {
  const item = entry.item
  const source =
    item.type === "imageGeneration" && /^(data:|https?:)/.test(item.result ?? "")
      ? item.result
      : item.type === "imageView" && /^(data:|https?:)/.test(item.path ?? "")
        ? item.path
        : undefined
  return (
    <AuroraImage
      src={source}
      alt={item.revisedPrompt ?? item.path ?? "Codex image"}
      status={
        item.status === "failed"
          ? "failed"
          : entry.completedAtMs
            ? "ready"
            : "generating"
      }
      prompt={item.revisedPrompt ?? undefined}
      caption={item.savedPath ?? item.path ?? undefined}
    />
  )
}

function SkillUsageItem({
  skill,
  entry,
  theme,
}: {
  skill: JsonObject
  entry: TimelineItem
  theme: "aurora" | "unraid"
}) {
  return (
    <section className="uc-skill-usage">
      <div className="uc-skill-usage-heading">
        <BookOpenCheck size={15} strokeWidth={1.65} aria-hidden />
        <div>
          <div className="aurora-text-label">{skill.name}</div>
          <div className="aurora-text-meta">
            {skill.shortDescription ?? skill.interface?.short_description ?? "Skill instructions loaded"}
          </div>
        </div>
        <Badge tone="info" size="sm">Skill</Badge>
      </div>
      {theme === "unraid" ? (
        <UnraidTerminalItem entry={entry} />
      ) : (
        <Terminal
          title="Skill Load"
          status={entry.completedAtMs ? "idle" : "connected"}
          lines={terminalLines(entry.item)}
          compact
        />
      )}
    </section>
  )
}

export function TimelineRenderer({
  entries,
  theme = "aurora",
  skills = [],
}: {
  entries: TimelineItem[]
  theme?: "aurora" | "unraid"
  skills?: JsonObject[]
}) {
  return (
    <>
      {entries.map((entry, index) => {
        const item = entry.item
        const toolTypes = ["mcpToolCall", "dynamicToolCall", "webSearch"]
        if (toolTypes.includes(item.type)) {
          if (index > 0 && toolTypes.includes(entries[index - 1].item.type)) return null
          const calls: ToolCall[] = []
          for (let cursor = index; cursor < entries.length; cursor += 1) {
            if (!toolTypes.includes(entries[cursor].item.type)) break
            calls.push(mappedToolCall(entries[cursor]))
          }
          return (
            <section className="uc-tool-group" key={`tools-${entry.id}`}>
              <div className="uc-tool-group-heading">
                <span>Tool Activity</span>
                <Badge
                  tone={calls.some((call) => call.status === "error") ? "error" : "info"}
                  size="sm"
                >
                  {calls.length} {calls.length === 1 ? "call" : "calls"}
                </Badge>
              </div>
              <ToolCalls calls={calls} />
            </section>
          )
        }
        switch (item.type) {
          case "userMessage":
          case "agentMessage":
            return <MessageItem key={entry.id} entry={entry} />
          case "hookPrompt":
            return (
              <Message key={entry.id} role="system" className="uc-message-system">
                <MessageContent tone="system" className="uc-message-content uc-message-system-content">
                  <Response
                    markdown={(item.fragments ?? [])
                      .map((fragment: JsonObject) => fragment.text ?? formatJson(fragment))
                      .join("\n")}
                  />
                </MessageContent>
              </Message>
            )
          case "reasoning":
            if (theme === "unraid") {
              return <UnraidReasoningItem key={entry.id} entry={entry} />
            }
            return (
              <Reasoning
                key={entry.id}
                isStreaming={!entry.completedAtMs}
                duration={
                  entry.completedAtMs && entry.startedAtMs
                    ? Math.round((entry.completedAtMs - entry.startedAtMs) / 1000)
                    : undefined
                }
                defaultOpen={false}
              >
                <Response
                  markdown={[...(item.summary ?? []), ...(item.content ?? [])]
                    .filter(Boolean)
                    .join("\n\n")}
                  streaming={!entry.completedAtMs}
                />
              </Reasoning>
            )
          case "plan":
            return <PlanItem key={entry.id} entry={entry} />
          case "commandExecution":
            {
              const skill = skills.find(
                (candidate) =>
                  candidate.path &&
                  String(item.command ?? "").includes(String(candidate.path)),
              )
              if (skill) {
                return (
                  <SkillUsageItem
                    key={entry.id}
                    skill={skill}
                    entry={entry}
                    theme={theme}
                  />
                )
              }
            }
            if (theme === "unraid") {
              return <UnraidTerminalItem key={entry.id} entry={entry} />
            }
            return (
              <Terminal
                key={entry.id}
                title={item.cwd ? `Terminal · ${item.cwd}` : "Terminal"}
                status={
                  item.status === "failed"
                    ? "error"
                    : entry.completedAtMs
                      ? "idle"
                      : "connected"
                }
                lines={terminalLines(item)}
                compact
              />
            )
          case "fileChange":
            return <FileChangeItem key={entry.id} entry={entry} />
          case "collabAgentToolCall":
            return <CollabItem key={entry.id} entry={entry} />
          case "subAgentActivity":
            return (
              <Agent
                key={entry.id}
                name={item.agentPath ?? "Subagent"}
                role={item.kind ?? "Agent activity"}
                status={entry.completedAtMs ? "completed" : "running"}
                task={item.agentThreadId}
                variant="compact"
              />
            )
          case "imageGeneration":
          case "imageView":
            return <ImageItem key={entry.id} entry={entry} />
          case "sleep":
            return (
              <Checkpoint
                key={entry.id}
                label="Waiting"
                description={`Paused for ${Math.round((item.durationMs ?? 0) / 1000)} seconds`}
                status={entry.completedAtMs ? "saved" : "current"}
                variant="compact"
              />
            )
          case "enteredReviewMode":
          case "exitedReviewMode":
            return (
              <Banner
                key={entry.id}
                variant="info"
                title={item.type === "enteredReviewMode" ? "Review started" : "Review completed"}
                description={item.review}
              />
            )
          case "contextCompaction":
            return (
              <Checkpoint
                key={entry.id}
                label="Context compacted"
                status="saved"
                badge
                variant="compact"
              />
            )
          case "approvalResolution":
            return <ApprovalResolutionItem key={entry.id} entry={entry} />
          default:
            return (
              <CodeBlock
                key={entry.id}
                code={formatJson(item)}
                language="json"
                filename={item.type ?? "App-server item"}
              />
            )
        }
      })}
    </>
  )
}

function approvalDetails(method: string, params: JsonObject) {
  const fileChange =
    method === "item/fileChange/requestApproval" ||
    method === "applyPatchApproval"
  const legacy =
    method === "execCommandApproval" ||
    method === "applyPatchApproval"
  const target =
    params.command ??
    params.cmd ??
    params.changes?.map((change: JsonObject) => change.path).join(", ") ??
    params.reason
  const available = params.availableDecisions
  const allowSession =
    legacy ||
    !Array.isArray(available) ||
    available.includes("acceptForSession")

  return {
    fileChange,
    legacy,
    allowSession,
    target: typeof target === "string" ? target : formatJson(target),
    description:
      params.reason ??
      (fileChange
        ? "Codex wants to apply file changes to your system:"
        : "Codex wants to run a command that can modify your system:"),
  }
}

function ApprovalCard({
  method,
  params,
  approved,
  denied,
  session,
  exitCode,
  onAllow,
  onDeny,
}: {
  method: string
  params: JsonObject
  approved?: boolean
  denied?: boolean
  session?: boolean
  exitCode?: number | null
  onAllow?: (always: boolean) => void
  onDeny?: () => void
}) {
  const details = approvalDetails(method, params)
  const [always, setAlways] = React.useState(false)
  const resolved = approved || denied
  return (
    <section
      className={`uc-approval-card${resolved ? " is-resolved" : ""}`}
      aria-label={resolved ? "Approval result" : "Approval needed"}
    >
      <div className="uc-approval-eyebrow">
        {resolved ? (approved ? "Approved" : "Denied") : "Approval Needed"}
      </div>
      {!resolved ? <p>{details.description}</p> : null}
      {details.target ? <code>{details.target}</code> : null}
      {resolved ? (
        <div className={`uc-approval-result${denied ? " is-denied" : ""}`}>
          {approved ? (
            <Check size={14} strokeWidth={2} aria-hidden />
          ) : (
            <XCircle size={14} strokeWidth={1.8} aria-hidden />
          )}
          <span>
            {approved
              ? `Approved${session ? " for this session" : ""}${
                  exitCode == null ? " — command queued" : ` — command ran with exit ${exitCode}`
                }`
              : "Denied — command was not run"}
          </span>
        </div>
      ) : (
        <div className="uc-approval-actions">
          <Button
            variant="rose"
            size="sm"
            filled
            onClick={() => onAllow?.(always)}
          >
            Allow
          </Button>
          <Button variant="neutral" size="sm" onClick={onDeny}>
            Deny
          </Button>
          {details.allowSession ? (
            <label className="uc-approval-always">
              <input
                type="checkbox"
                checked={always}
                onChange={(event) => setAlways(event.target.checked)}
              />
              <span>Always allow</span>
            </label>
          ) : null}
        </div>
      )}
    </section>
  )
}

function ApprovalRequest({
  request,
  answer,
}: {
  request: ServerRequest
  answer: (result: JsonObject) => void
}) {
  const details = approvalDetails(request.method, request.params)
  return (
    <ApprovalCard
      method={request.method}
      params={request.params}
      onAllow={(always) =>
        answer({
          decision: details.legacy
            ? always
              ? "approved_for_session"
              : "approved"
            : always
              ? "acceptForSession"
              : "accept",
        })
      }
      onDeny={() =>
        answer({ decision: details.legacy ? "denied" : "decline" })
      }
    />
  )
}

function ApprovalResolutionItem({ entry }: { entry: TimelineItem }) {
  const item = entry.item
  return (
    <ApprovalCard
      method={item.requestMethod}
      params={item.requestParams ?? {}}
      approved={item.approved}
      denied={!item.approved}
      session={item.session}
      exitCode={item.exitCode}
    />
  )
}

function PermissionsRequest({
  request,
  answer,
}: {
  request: ServerRequest
  answer: (result: JsonObject) => void
}) {
  return (
    <PermissionPrompt
      tool="Additional Permissions"
      action={request.params.reason ?? "Codex requested additional permissions"}
      target={formatJson(request.params.permissions)}
      variant="inline"
      onAllow={() =>
        answer({
          permissions: request.params.permissions,
          scope: "turn",
          strictAutoReview: true,
        })
      }
      onDeny={() =>
        answer({ permissions: {}, scope: "turn", strictAutoReview: true })
      }
      allowLabel="Approve Once"
      denyLabel="Decline"
    />
  )
}

function UserInputRequest({
  request,
  answer,
}: {
  request: ServerRequest
  answer: (result: JsonObject) => void
}) {
  const questions = request.params.questions ?? []
  const [answers, setAnswers] = React.useState<Record<string, { answers: string[] }>>({})
  return (
    <div className="uc-stack">
      {questions.map((question: JsonObject) => (
        <AskUserQuestion
          key={question.id}
          question={question.question}
          type={question.options?.length ? "radio" : "text"}
          options={question.options?.map((option: JsonObject) => ({
            id: option.label,
            label: option.label,
            description: option.description,
          }))}
          onSubmit={(value) => {
            const values = Array.isArray(value) ? value : [value]
            setAnswers((current) => ({
              ...current,
              [question.id]: { answers: values },
            }))
          }}
        />
      ))}
      <div className="uc-request-actions">
        <Button
          variant="aurora"
          size="sm"
          disabled={Object.keys(answers).length !== questions.length}
          onClick={() => answer({ answers })}
        >
          Submit Answers
        </Button>
        <Button variant="neutral" size="sm" onClick={() => answer({ answers: {} })}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function ElicitationRequest({
  request,
  answer,
}: {
  request: ServerRequest
  answer: (result: JsonObject) => void
}) {
  const schema = request.params.requestedSchema ?? {}
  const [content, setContent] = React.useState<JsonObject>(() =>
    Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([name, field]: [string, any]) => [
        name,
        field.default ?? (field.type === "boolean" ? false : ""),
      ]),
    ),
  )

  if (request.params.mode === "url") {
    return (
      <div className="uc-request-card">
        <Banner
          variant="info"
          title={`${request.params.serverName ?? "MCP server"} request`}
          description={request.params.message}
        />
        <div className="uc-request-actions">
          <Button
            variant="aurora"
            size="sm"
            onClick={() => window.open(request.params.url, "_blank", "noopener")}
          >
            Open Request
          </Button>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => answer({ action: "accept", content: null, _meta: null })}
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => answer({ action: "decline", content: null, _meta: null })}
          >
            Decline
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="uc-request-card">
      <div>
        <div className="aurora-text-section">
          {request.params.serverName ?? "MCP Server"} Request
        </div>
        <div className="aurora-text-body-sm uc-muted">{request.params.message}</div>
      </div>
      {Object.entries(schema.properties ?? {}).map(([name, field]: [string, any]) => (
        <label className="uc-field" key={name}>
          <span className="aurora-text-label">{field.title ?? name}</span>
          {Array.isArray(field.enum) ? (
            <Select
              value={String(content[name] ?? "")}
              onValueChange={(value) => setContent((current) => ({ ...current, [name]: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.enum.map((value: unknown) => (
                  <SelectItem key={String(value)} value={String(value)}>
                    {String(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={field.secret ? "password" : ["number", "integer"].includes(field.type) ? "number" : "text"}
              value={String(content[name] ?? "")}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  [name]: ["number", "integer"].includes(field.type)
                    ? Number(event.target.value)
                    : event.target.value,
                }))
              }
            />
          )}
        </label>
      ))}
      <div className="uc-request-actions">
        <Button
          variant="aurora"
          size="sm"
          onClick={() => answer({ action: "accept", content, _meta: null })}
        >
          Submit
        </Button>
        <Button
          variant="neutral"
          size="sm"
          onClick={() => answer({ action: "decline", content: null, _meta: null })}
        >
          Decline
        </Button>
      </div>
    </div>
  )
}

export function RequestRenderer({
  request,
  answer,
  reject,
}: {
  request: ServerRequest
  answer: (result: JsonObject) => void
  reject: (message: string) => void
}) {
  switch (request.method) {
    case "item/commandExecution/requestApproval":
    case "item/fileChange/requestApproval":
    case "execCommandApproval":
    case "applyPatchApproval":
      return <ApprovalRequest request={request} answer={answer} />
    case "item/permissions/requestApproval":
      return <PermissionsRequest request={request} answer={answer} />
    case "item/tool/requestUserInput":
      return <UserInputRequest request={request} answer={answer} />
    case "mcpServer/elicitation/request":
      return <ElicitationRequest request={request} answer={answer} />
    default:
      return (
        <Banner
          variant="warn"
          title="Unsupported app-server request"
          description={request.method}
          action={
            <Button
              variant="neutral"
              size="sm"
              onClick={() => reject(`The Unraid chathead cannot answer ${request.method}.`)}
            >
              Dismiss
            </Button>
          }
        />
      )
  }
}

export function PlanRenderer({
  plan,
  streaming,
}: {
  plan: JsonObject
  streaming: boolean
}) {
  return (
    <Plan
      title={plan.explanation ?? "Current Plan"}
      steps={(plan.plan ?? []).map((step: JsonObject) => ({
        label: step.step,
        status:
          step.status === "completed"
            ? "done"
            : step.status === "in_progress"
              ? "inprog"
              : "pending",
      }))}
      isStreaming={streaming}
    />
  )
}

export function ContextRenderer({ tokenUsage }: { tokenUsage: JsonObject }) {
  const current = tokenUsage.last ?? tokenUsage.total ?? {}
  const cached = Math.min(current.cachedInputTokens ?? 0, current.inputTokens ?? 0)
  const reasoning = Math.min(current.reasoningOutputTokens ?? 0, current.outputTokens ?? 0)
  return (
    <Context
      variant="compact"
      limit={tokenUsage.modelContextWindow ?? undefined}
      segments={[
        { label: "Input", value: Math.max(0, (current.inputTokens ?? 0) - cached) },
        { label: "Cached", value: cached },
        { label: "Output", value: Math.max(0, (current.outputTokens ?? 0) - reasoning) },
        { label: "Reasoning", value: reasoning },
      ]}
    />
  )
}
