export type ClientAuthMode = "bearer" | "oauth";

export interface EndpointOptions {
  host: string;
  port: string;
  pageHostname: string;
  tailscaleEnabled: boolean;
  tailscaleDnsName: string;
  authMode: ClientAuthMode;
  publicUrl: string;
}

export interface ClientConfigOptions {
  url: string;
  authMode: ClientAuthMode;
  authDisabled: boolean;
  token: string;
}

export function rustVersion(tagOrVersion: string): string {
  return tagOrVersion.trim().replace(/^unraid-rs-v/, "").replace(/^v/, "");
}

function semverParts(value: string): [number, number, number] | null {
  const match = rustVersion(value).match(/^(\d+)\.(\d+)\.(\d+)$/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

export function compareRustVersions(left: string, right: string): number {
  const a = semverParts(left);
  const b = semverParts(right);
  if (!a || !b) return 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

export function updateIsNewer(installed: string, latestTag: string): boolean {
  return compareRustVersions(installed, latestTag) < 0;
}

export function isValidBindHost(host: string): boolean {
  let value = host.trim().replace(/^\[|\]$/g, "");
  if (!value) return false;

  if (value.includes(":")) {
    try {
      const parsed = new URL(`http://[${value}]/`);
      return parsed.hostname.length > 2;
    } catch {
      return false;
    }
  }

  const octets = value.split(".");
  if (octets.length === 4 && octets.every((part) => /^\d+$/.test(part))) {
    return octets.every((part) => part.length <= 3 && Number(part) <= 255);
  }

  if (value.endsWith(".")) value = value.slice(0, -1);
  if (!value || value.length > 253) return false;
  return value.split(".").every(
    (label) => label.length > 0
      && label.length <= 63
      && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
  );
}

export function isLoopbackHost(host: string): boolean {
  const value = host.trim().replace(/^\[|\]$/g, "").toLowerCase();
  if (value === "localhost" || value === "::1") return true;
  const octets = value.split(".");
  return octets.length === 4
    && octets[0] === "127"
    && octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255);
}

export function isValidHttpUrl(value: string, httpsOnly = false): boolean {
  try {
    const url = new URL(value);
    if (!url.hostname || !["http:", "https:"].includes(url.protocol)) return false;
    if (url.username || url.password) return false;
    if (httpsOnly && (url.protocol !== "https:" || url.search || url.hash)) return false;
    return true;
  } catch {
    return false;
  }
}

function bracketIpv6(host: string): string {
  const value = host.trim();
  if (value.startsWith("[") && value.endsWith("]")) return value;
  return value.includes(":") ? `[${value}]` : value;
}

function mcpUrl(base: string): string {
  const clean = base.trim().replace(/\/+$/, "");
  return clean.endsWith("/mcp") ? clean : `${clean}/mcp`;
}

export function buildEndpoint(options: EndpointOptions): string {
  if (options.authMode === "oauth" && options.publicUrl.trim()) {
    return mcpUrl(options.publicUrl);
  }

  if (options.tailscaleEnabled && options.tailscaleDnsName.trim()) {
    return `https://${options.tailscaleDnsName.trim()}:${options.port}/mcp`;
  }

  const configured = options.host.trim();
  const host = !configured || configured === "0.0.0.0" || configured === "::" || configured === "[::]"
    ? options.pageHostname
    : configured;
  return `http://${bracketIpv6(host)}:${options.port}/mcp`;
}

export function buildMcpClientConfig(options: ClientConfigOptions): object {
  const server: { url: string; headers?: Record<string, string> } = { url: options.url };
  if (!options.authDisabled && options.authMode === "bearer") {
    server.headers = { Authorization: `Bearer ${options.token || "<your bearer token>"}` };
  }
  return { mcpServers: { unraid: server } };
}
