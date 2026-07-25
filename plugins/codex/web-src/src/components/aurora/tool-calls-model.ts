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

function groupStatus(calls: ToolCallModel[]): ToolCallModel["status"] {
  if (calls.some((call) => call.status === "error")) return "error"
  if (calls.some((call) => call.status === "running")) return "running"
  return "completed"
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
  return group.tool.replace(/[._-]+/g, " ")
}
