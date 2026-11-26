/**
 * Transport to the plugin's PHP settings endpoint.
 *
 * Auth is the webGUI session cookie (same-origin) plus Unraid's CSRF token.
 * The token script may not have executed before our element mounts, so we
 * poll briefly for window.csrf_token before the first mutating request —
 * the same race guard incus-unraid's graphql-client uses.
 *
 * POSTs are form-encoded: webGui/include/local_prepend.php runs before
 * config.php and accepts the token only as the `csrf_token` form field. A JSON
 * body with an X-Csrf-Token header is rejected with an empty response before
 * config.php runs. The action payload travels as JSON in the `payload` field.
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
  throw new Error("Unraid CSRF token is unavailable; reload the webGUI and try again");
}

async function readJson(res: Response, what: string): Promise<unknown> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const error = (body as { error?: unknown } | null)?.error;
  if (!res.ok) {
    throw new Error(typeof error === "string" ? error : `${what} failed: HTTP ${res.status}`);
  }
  if (body === null || typeof body !== "object") {
    throw new Error(
      `${what} failed: the webGUI returned no JSON (session expired or CSRF check failed?); reload the page and try again`,
    );
  }
  return body;
}

async function request(init?: RequestInit): Promise<ConfigPayload> {
  const res = await fetch(ENDPOINT, { credentials: "include", ...init });
  return (await readJson(res, "request")) as ConfigPayload;
}

/** Form-encode a POST so Unraid's global CSRF gate sees `csrf_token`. */
export async function postBody(payload: object): Promise<URLSearchParams> {
  return new URLSearchParams({
    csrf_token: await csrfToken(),
    payload: JSON.stringify(payload),
  });
}

async function postAction(payload: object, what: string): Promise<unknown> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "include",
    body: await postBody(payload),
  });
  return readJson(res, what);
}

export function loadConfig(): Promise<ConfigPayload> {
  return request();
}

async function post(payload: object): Promise<ConfigPayload> {
  return (await postAction(payload, "request")) as ConfigPayload;
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
  const body = (await postAction({ action: "reveal", key }, "reveal")) as { value?: unknown };
  return String(body.value ?? "");
}

/** Tail the service log (session + CSRF gated server-side). */
export async function fetchLogs(lines = 200): Promise<string> {
  const body = (await postAction({ action: "logs", lines }, "log fetch")) as { log?: unknown };
  return String(body.log ?? "");
}

/** Ask GitHub for the latest release tag (explicit user action). */
export async function checkUpdate(): Promise<string> {
  return (await postJson<{ latest?: string }>({ action: "checkUpdate" })).latest ?? "";
}

/** Install a Rust release (empty string = latest) as the persistent binary overlay. */
export async function updateServer(version: string): Promise<ConfigPayload> {
  return post({ action: "update", version });
}

/** Remove the overlay binary, reverting to the plugin-bundled version. */
export async function resetServer(): Promise<ConfigPayload> {
  return post({ action: "resetVersion" });
}

/** POST returning a typed JSON object (not the full ConfigPayload). */
async function postJson<T>(payload: object): Promise<T> {
  return (await postAction(payload, "request")) as T;
}

/** Cheap live poll for the dashboard (service + process, no env reads). */
export async function fetchStats(): Promise<StatsPayload> {
  return await postJson<StatsPayload>({ action: "stats" });
}
