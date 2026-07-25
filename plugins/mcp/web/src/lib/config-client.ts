/**
 * Transport to the plugin's PHP settings endpoint.
 *
 * Auth is the webGUI session cookie (same-origin) plus Unraid's CSRF token.
 * The token script may not have executed before our element mounts, so we
 * poll briefly for window.csrf_token before the first mutating request —
 * the same race guard incus-unraid's graphql-client uses.
 */

const ENDPOINT = "/plugins/unraid-mcp/include/config.php";

declare global {
  interface Window {
    csrf_token?: string;
  }
}

export interface ServiceState {
  enabled: boolean;
  running: boolean;
}

export interface TailscaleState {
  available: boolean;
  dnsName: string;
  serveActive: boolean;
}

export interface VersionState {
  installed: string;
  overlay: boolean;
}

export interface ProcessState {
  pid: number;
  cpu: number;
  memMB: number;
  uptime: number;
}

export interface ConfigPayload {
  config: Record<string, string | boolean>;
  extra: Record<string, string>;
  service: ServiceState;
  tailscale?: TailscaleState;
  version?: VersionState;
  process?: ProcessState;
}

export interface StatsPayload {
  service: ServiceState;
  process?: ProcessState;
}

async function csrfToken(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    if (window.csrf_token) return window.csrf_token;
    await new Promise((r) => setTimeout(r, 100));
  }
  return window.csrf_token ?? "";
}

async function request(init?: RequestInit): Promise<ConfigPayload> {
  const res = await fetch(ENDPOINT, { credentials: "include", ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `request failed: HTTP ${res.status}`);
  }
  return body as ConfigPayload;
}

export function loadConfig(): Promise<ConfigPayload> {
  return request();
}

async function post(payload: object): Promise<ConfigPayload> {
  return request({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Csrf-Token": await csrfToken(),
    },
    body: JSON.stringify(payload),
  });
}

/** Save changed keys. Secrets: send a value to replace, "" to clear, omit to keep. */
export function saveConfig(changes: Record<string, string>): Promise<ConfigPayload> {
  return post({ action: "save", changes });
}

export type ServiceOp = "start" | "stop" | "restart" | "enable" | "disable";

export function serviceAction(op: ServiceOp): Promise<ConfigPayload> {
  return post({ action: "service", op });
}

/** Fetch a stored secret value (session + CSRF gated server-side). */
export async function revealSecret(key: string): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Csrf-Token": await csrfToken(),
    },
    body: JSON.stringify({ action: "reveal", key }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `reveal failed: HTTP ${res.status}`);
  }
  return String(body?.value ?? "");
}

/** Tail the service log (session + CSRF gated server-side). */
export async function fetchLogs(lines = 200): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Csrf-Token": await csrfToken(),
    },
    body: JSON.stringify({ action: "logs", lines }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `log fetch failed: HTTP ${res.status}`);
  }
  return String(body?.log ?? "");
}

/** Ask GitHub for the latest release tag (explicit user action). */
export async function checkUpdate(): Promise<string> {
  return (await postJson<{ latest?: string }>({ action: "checkUpdate" })).latest ?? "";
}

/** Install a version (empty string = latest) into the array overlay venv. */
export async function updateServer(version: string): Promise<ConfigPayload> {
  return post({ action: "update", version });
}

/** Remove the overlay venv, reverting to the plugin-bundled version. */
export async function resetServer(): Promise<ConfigPayload> {
  return post({ action: "resetVersion" });
}

/** POST returning a typed JSON object (not the full ConfigPayload). */
async function postJson<T>(payload: object): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Csrf-Token": await csrfToken(),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `request failed: HTTP ${res.status}`);
  return (body ?? {}) as T;
}

/** Cheap live poll for the dashboard (service + process, no env reads). */
export async function fetchStats(): Promise<StatsPayload> {
  return await postJson<StatsPayload>({ action: "stats" });
}
