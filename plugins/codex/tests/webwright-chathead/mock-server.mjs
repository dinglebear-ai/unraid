import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(new URL("../../web-src/package.json", import.meta.url))
const { WebSocketServer } = require("ws")

const port = Number(process.env.PORT ?? 4173)
const pluginRoot = path.resolve(
  import.meta.dirname,
  "../../source/usr/local/emhttp/plugins/unraid-codex/web",
)

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Unraid Codex UI Harness</title>
    <style>
      body { margin: 0; background: #f2f2f2; color: #202020; font: 14px Arial, sans-serif; }
      header { padding: 22px 28px; background: #242c38; color: white; }
      nav { display: flex; gap: 24px; margin-top: 18px; text-transform: uppercase; letter-spacing: .12em; }
      main { padding: 28px; }
      .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
      .card { min-height: 150px; padding: 18px; border: 1px solid #d3d3d3; border-radius: 8px; background: white; }
    </style>
  </head>
  <body>
    <header><strong>UNRAID</strong><nav><span>Dashboard</span><span>Main</span><span>Shares</span><span>Settings</span></nav></header>
    <main>
      <h1>Incus</h1>
      <div class="cards"><div class="card">Containers</div><div class="card">Storage</div><div class="card">Network</div></div>
    </main>
    <script src="/plugins/unraid-codex/web/unraid-codex.js"></script>
  </body>
</html>`

const server = http.createServer((request, response) => {
  const requestPath = new URL(request.url, `http://${request.headers.host}`).pathname
  if (requestPath === "/plugins/unraid-codex/web/unraid-codex.js") {
    response.setHeader("content-type", "text/javascript")
    response.end(fs.readFileSync(path.join(pluginRoot, "unraid-codex.js")))
    return
  }
  if (requestPath === "/plugins/unraid-codex/web/unraid-codex.css") {
    response.setHeader("content-type", "text/css")
    response.end(fs.readFileSync(path.join(pluginRoot, "unraid-codex.css")))
    return
  }
  response.setHeader("content-type", "text/html")
  response.end(html)
})

const webSocketServer = new WebSocketServer({ noServer: true })
server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/webterminal/unraid-codex-appserver/ws") {
    socket.destroy()
    return
  }
  webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
    webSocketServer.emit("connection", webSocket)
  })
})

function send(webSocket, method, params) {
  webSocket.send(JSON.stringify({ method, params }))
}

function response(webSocket, id, result) {
  webSocket.send(JSON.stringify({ id, result }))
}

let mcpConfig = {
  unraid: { url: "https://unraid.example.test/mcp", enabled: true },
  labby: { command: "labby", args: ["mcp"], enabled: true },
}

const plugins = [
  {
    id: "unraid@local",
    name: "Unraid",
    installed: true,
    enabled: true,
    localVersion: "1.0.0",
    keywords: ["server", "storage"],
  },
  {
    id: "github@curated",
    name: "GitHub",
    installed: false,
    enabled: false,
    version: "2.0.0",
    keywords: ["code", "pull requests"],
  },
]

webSocketServer.on("connection", (webSocket) => {
  webSocket.on("message", (buffer) => {
    const message = JSON.parse(buffer.toString())
    if (!Object.hasOwn(message, "id")) return
    if (!message.method && message.id === "approval-1") {
      send(webSocket, "turn/completed", {
        threadId: "thread-mock",
        turn: {
          id: "turn-mock",
          status: "completed",
          items: [],
          itemsView: "full",
          error: null,
        },
      })
      return
    }
    switch (message.method) {
      case "initialize":
        response(webSocket, message.id, {
          userAgent: "codex-cli/0.145.0",
          platformFamily: "unix",
          platformOs: "linux",
          platformArch: "x86_64",
        })
        break
      case "account/read":
        response(webSocket, message.id, {
          account: { type: "chatgpt", email: "agent@example.test", planType: "plus" },
          requiresOpenaiAuth: true,
        })
        break
      case "model/list":
        response(webSocket, message.id, {
          data: [
            {
              id: "gpt-5-codex",
              model: "gpt-5-codex",
              displayName: "GPT-5 Codex",
              hidden: false,
              supportedReasoningEfforts: [
                { reasoningEffort: "low" },
                { reasoningEffort: "medium" },
                { reasoningEffort: "high" },
              ],
            },
          ],
        })
        break
      case "thread/resume":
        response(webSocket, message.id, {
          thread: {
            id: message.params.threadId,
            cwd: "/workspace",
            turns: [],
          },
        })
        send(webSocket, "thread/tokenUsage/updated", {
          threadId: message.params.threadId,
          turnId: "turn-existing",
          tokenUsage: {
            total: {
              totalTokens: 2593000,
              inputTokens: 2400000,
              cachedInputTokens: 900000,
              outputTokens: 193000,
              reasoningOutputTokens: 80000,
            },
            last: {
              totalTokens: 126000,
              inputTokens: 118000,
              cachedInputTokens: 72000,
              outputTokens: 8000,
              reasoningOutputTokens: 4200,
            },
            modelContextWindow: 258000,
          },
        })
        break
      case "thread/start":
        response(webSocket, message.id, {
          thread: { id: "thread-mock", cwd: "/workspace", turns: [] },
        })
        break
      case "config/read":
        response(webSocket, message.id, {
          config: {
            model: "gpt-5-codex",
            model_reasoning_effort: "medium",
            approval_policy: "on-request",
            permission_profile: "default",
            mcp_servers: mcpConfig,
          },
        })
        break
      case "skills/list":
        response(webSocket, message.id, {
          data: [
            {
              skills: [
                {
                  name: "unraid",
                  path: "/home/agent/.agents/skills/unraid/SKILL.md",
                  enabled: true,
                  scope: "user",
                  shortDescription: "Operate Unraid safely.",
                },
              ],
            },
          ],
        })
        break
      case "hooks/list":
        response(webSocket, message.id, { data: [] })
        break
      case "permissionProfile/list":
        response(webSocket, message.id, {
          data: [
            { id: "default", description: "Ask before sensitive actions.", allowed: true },
            { id: "read-only", description: "Read-only workspace access.", allowed: true },
          ],
        })
        break
      case "mcpServerStatus/list":
        response(webSocket, message.id, {
          data: Object.entries(mcpConfig).map(([name, definition]) => ({
            name,
            authStatus: "notLoggedIn",
            tools: name === "unraid" ? { server: {}, docker: {}, shares: {} } : { search: {} },
            resources: [],
            resourceTemplates: [],
            startupStatus: definition.enabled === false ? "disabled" : "ready",
          })),
          nextCursor: null,
        })
        break
      case "app/list":
        response(webSocket, message.id, {
          data: [
            {
              id: "unraid-app",
              name: "Unraid",
              description: "Unraid control surface",
              isAccessible: true,
              isEnabled: true,
            },
            ...Array.from({ length: 20 }, (_, index) => ({
              id: `app-${index}`,
              name: `Connected App ${index + 1}`,
              description: "Optional connected application.",
              isAccessible: index % 2 === 0,
              isEnabled: index % 2 === 0,
            })),
          ],
          nextCursor: null,
        })
        break
      case "plugin/list":
        response(webSocket, message.id, {
          marketplaces: [
            {
              name: "curated",
              path: null,
              plugins,
            },
          ],
          marketplaceLoadErrors: [],
        })
        break
      case "plugin/install": {
        const plugin = plugins.find((entry) => entry.name === message.params.pluginName)
        if (plugin) {
          plugin.installed = true
          plugin.enabled = true
        }
        response(webSocket, message.id, {})
        break
      }
      case "plugin/uninstall": {
        const plugin = plugins.find((entry) => entry.id === message.params.pluginId)
        if (plugin) {
          plugin.installed = false
          plugin.enabled = false
        }
        response(webSocket, message.id, {})
        break
      }
      case "config/batchWrite":
        for (const edit of message.params.edits ?? []) {
          const match = edit.keyPath.match(/^mcp_servers\."(.+)"$/)
          if (!match) continue
          if (edit.value == null) delete mcpConfig[match[1]]
          else mcpConfig[match[1]] = edit.value
        }
        response(webSocket, message.id, { status: "ok", version: "mock" })
        break
      case "config/value/write": {
        const match = message.params.keyPath.match(/^mcp_servers\."(.+)"$/)
        if (match && message.params.value == null) delete mcpConfig[match[1]]
        response(webSocket, message.id, { status: "ok", version: "mock" })
        break
      }
      case "config/mcpServer/reload":
      case "thread/settings/update":
        response(webSocket, message.id, {})
        break
      case "turn/start": {
        const turnId = "turn-mock"
        response(webSocket, message.id, { turn: { id: turnId } })
        send(webSocket, "turn/started", { threadId: "thread-mock", turn: { id: turnId } })
        const reasoning = {
          type: "reasoning",
          id: "reasoning-1",
          summary: ["Inspecting the workspace and current services."],
          content: [],
        }
        send(webSocket, "item/started", {
          threadId: "thread-mock",
          turnId,
          item: reasoning,
          startedAtMs: Date.now(),
        })
        send(webSocket, "item/completed", {
          threadId: "thread-mock",
          turnId,
          item: reasoning,
          completedAtMs: Date.now() + 400,
        })
        send(webSocket, "turn/plan/updated", {
          threadId: "thread-mock",
          turnId,
          explanation: "Inspect and report",
          plan: [
            { step: "Inspect the container", status: "completed" },
            { step: "Verify the service", status: "in_progress" },
            { step: "Summarize the result", status: "pending" },
          ],
        })
        const skillCommand = {
          type: "commandExecution",
          id: "skill-command-1",
          command: "cat /home/agent/.agents/skills/unraid/SKILL.md",
          cwd: "/workspace",
          status: "completed",
          aggregatedOutput: "# Unraid\\nOperate the server through the scoped API.",
          exitCode: 0,
        }
        send(webSocket, "item/started", {
          threadId: "thread-mock",
          turnId,
          item: { ...skillCommand, status: "inProgress", aggregatedOutput: "" },
          startedAtMs: Date.now(),
        })
        send(webSocket, "item/completed", {
          threadId: "thread-mock",
          turnId,
          item: skillCommand,
          completedAtMs: Date.now() + 500,
        })
        const command = {
          type: "commandExecution",
          id: "command-1",
          command: "systemctl is-active codex-appserver",
          cwd: "/workspace",
          status: "completed",
          aggregatedOutput: "active\n",
          exitCode: 0,
        }
        send(webSocket, "item/started", {
          threadId: "thread-mock",
          turnId,
          item: { ...command, status: "inProgress", aggregatedOutput: "" },
          startedAtMs: Date.now(),
        })
        send(webSocket, "item/completed", {
          threadId: "thread-mock",
          turnId,
          item: command,
          completedAtMs: Date.now() + 700,
        })
        const tool = {
          type: "mcpToolCall",
          id: "tool-1",
          server: "labby",
          tool: "time.get_current_time",
          arguments: { timezone: "UTC" },
          status: "completed",
          result: {
            content: [{ type: "text", text: "2026-07-23 05:20 UTC" }],
            structuredContent: null,
          },
          error: null,
        }
        send(webSocket, "item/started", {
          threadId: "thread-mock",
          turnId,
          item: { ...tool, status: "inProgress", result: null },
          startedAtMs: Date.now(),
        })
        send(webSocket, "item/completed", {
          threadId: "thread-mock",
          turnId,
          item: tool,
          completedAtMs: Date.now() + 900,
        })
        const answer = {
          type: "agentMessage",
          id: "message-1",
          text: "The app server is active and the read-only Labby check succeeded.",
          phase: "final_answer",
          memoryCitation: null,
        }
        send(webSocket, "item/started", {
          threadId: "thread-mock",
          turnId,
          item: { ...answer, text: "" },
          startedAtMs: Date.now(),
        })
        send(webSocket, "item/agentMessage/delta", {
          threadId: "thread-mock",
          turnId,
          itemId: answer.id,
          delta: answer.text,
        })
        send(webSocket, "item/completed", {
          threadId: "thread-mock",
          turnId,
          item: answer,
          completedAtMs: Date.now() + 1100,
        })
        webSocket.send(
          JSON.stringify({
            id: "approval-1",
            method: "item/commandExecution/requestApproval",
            params: {
              threadId: "thread-mock",
              turnId,
              itemId: "approval-command",
              command: "touch /workspace/approved",
              reason: "Create a test marker in the workspace.",
            },
          }),
        )
        break
      }
      case "turn/interrupt":
        response(webSocket, message.id, {})
        break
      default:
        response(webSocket, message.id, {})
    }
  })
})

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`mock server listening on http://127.0.0.1:${port}\n`)
})
