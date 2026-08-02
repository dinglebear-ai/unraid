export interface ToolCallModel {
  id: string
  tool: string
  args: Record<string, unknown>
  status: "running" | "completed" | "error"
  result?: string
  startedAt?: Date
  completedAt?: Date
}

export interface ToolCallGroup {
  id: string
  tool: string
  status: ToolCallModel["status"]
  calls: ToolCallModel[]
}

export interface ToolDisplay {
  provider: string
  action: string | null
  compact: string
  detail: string
}

const PROVIDER_NAMES: Record<string, string> = {
  unraid: "Unraid",
  github: "GitHub",
  openai: "OpenAI",
  mcp: "MCP",
  filesystem: "Files",
  web: "Web",
  bash: "Shell",
  shell: "Shell",
  terminal: "Terminal",
}

function splitToolWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[.\s_:/-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function titleWord(value: string): string {
  const known = PROVIDER_NAMES[value.toLowerCase()]
  if (known) return known
  return value.length <= 3
    ? value.toUpperCase()
    : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

const ACTION_VERBS = new Set([
  "add",
  "check",
  "create",
  "delete",
  "execute",
  "fetch",
  "find",
  "get",
  "inspect",
  "list",
  "open",
  "read",
  "remove",
  "run",
  "search",
  "set",
  "start",
  "stop",
  "update",
  "write",
])

function trimRepeatedCategory(values: string[]): string[] {
  if (values.length < 3) return values
  const category = values[0].toLowerCase()
  const verb = values[1].toLowerCase()
  const repeatsLater = values.slice(2).some((value) => value.toLowerCase() === category)
  return ACTION_VERBS.has(verb) && repeatsLater ? values.slice(1) : values
}

function sentenceWords(values: string[]): string {
  const phrased = trimRepeatedCategory(values)
  if (!phrased.length) return ""
  return phrased
    .map((value, index) => {
      const known = PROVIDER_NAMES[value.toLowerCase()]
      if (known) return known
      return index === 0
        ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
        : value.toLowerCase()
    })
    .join(" ")
}

export function describeTool(tool: string): ToolDisplay {
  const raw = splitToolWords(tool)
  const deduped = raw.filter(
    (part, index) => index === 0 || part.toLowerCase() !== raw[index - 1].toLowerCase(),
  )
  const providerToken = deduped[0] ?? "tool"
  const provider = titleWord(providerToken)
  const actionTokens = deduped.slice(1).filter(
    (part) => part.toLowerCase() !== providerToken.toLowerCase(),
  )
  const action = sentenceWords(actionTokens) || null

  return {
    provider,
    action,
    compact: action ? `${provider} · ${action}` : provider,
    detail: action ? `${provider}: ${action}` : provider,
  }
}

function groupStatus(calls: ToolCallModel[]): ToolCallModel["status"] {
  if (calls.some((call) => call.status === "error")) return "error"
  if (calls.some((call) => call.status === "running")) return "running"
  return "completed"
}

export function activityStatus(calls: ToolCallModel[]): ToolCallModel["status"] {
  return groupStatus(calls)
}

export function groupConsecutiveCalls(calls: ToolCallModel[]): ToolCallGroup[] {
  const groups: ToolCallGroup[] = []

  for (const call of calls) {
    const previous = groups.at(-1)
    if (previous && previous.tool === call.tool) {
      previous.calls.push(call)
      previous.status = groupStatus(previous.calls)
      continue
    }

    groups.push({
      id: call.id,
      tool: call.tool,
      status: call.status,
      calls: [call],
    })
  }

  return groups
}

export function summarizeToolCallGroup(group: ToolCallGroup): string {
  return describeTool(group.tool).compact
}

export function summarizeToolActivity(calls: ToolCallModel[]): string {
  const groups = groupConsecutiveCalls(calls)
  if (!groups.length) return "Tool activity"
  if (groups.length === 1) return summarizeToolCallGroup(groups[0])

  const providers = [...new Set(groups.map((group) => describeTool(group.tool).provider))]
  if (providers.length === 1) return `${providers[0]} · ${groups.length} actions`
  return `${groups.length} tool actions`
}
