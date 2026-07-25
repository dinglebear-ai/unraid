/** Field metadata drives the whole form — one row per env var. */
export interface FieldDef {
  key: string;
  label: string;
  help: string;
  kind: "text" | "secret" | "toggle" | "select" | "number";
  options?: string[];
  mono?: boolean;
  placeholder?: string;
}

export interface Section {
  title: string;
  collapsed?: boolean;
  /** Which of the three settings columns this section renders in. */
  col: "a" | "b" | "c";
  /** Gated sections stay collapsed to an enable toggle until opted in. */
  gated?: boolean;
  fields: FieldDef[];
}

export const SECTIONS: Section[] = [
  {
    title: "Unraid API",
    col: "a",
    fields: [
      {
        key: "UNRAID_API_URL",
        label: "GraphQL URL",
        help: "The local Unraid GraphQL endpoint, e.g. http://127.0.0.1:<webgui port>/graphql. Detected automatically at install.",
        kind: "text",
        mono: true,
        placeholder: "http://127.0.0.1/graphql",
      },
      {
        key: "UNRAID_API_KEY",
        label: "API key",
        help: "Unraid API key. Auto-provisioned at install when possible; create one with: unraid-api apikey --create --name unraidmcp -r admin --json",
        kind: "secret",
      },
      {
        key: "UNRAID_VERIFY_SSL",
        label: "Verify SSL",
        help: "Only relevant for https:// API URLs. Instead of turning this off, point it at a CA bundle path to trust a self-signed cert.",
        kind: "toggle",
      },
      {
        key: "UNRAID_ALLOW_INSECURE_TLS",
        label: "Allow insecure TLS",
        help: "Required opt-in when Verify SSL is off for an https:// URL — acknowledges the API key travels to an unverified peer.",
        kind: "toggle",
      },
    ],
  },
  {
    title: "MCP server",
    col: "b",
    fields: [
      {
        key: "UNRAID_MCP_TRANSPORT",
        label: "Transport",
        help: "streamable-http serves MCP over HTTP (what claude.ai and Claude Code connect to); stdio is for local piping only.",
        kind: "select",
        options: ["streamable-http", "sse", "stdio"],
      },
      {
        key: "UNRAID_MCP_HOST",
        label: "Bind host",
        help: "0.0.0.0 exposes the server on all interfaces; bearer auth protects it.",
        kind: "text",
        mono: true,
        placeholder: "0.0.0.0",
      },
      {
        key: "UNRAID_MCP_PORT",
        label: "Port",
        help: "TCP port for the MCP HTTP endpoint.",
        kind: "number",
        placeholder: "6970",
      },
      {
        key: "UNRAID_MCP_TAILSCALE_SERVE",
        label: "Tailscale Serve",
        help: "Publish the MCP endpoint on your tailnet as HTTPS with automatic certs, via the official Tailscale plugin's daemon (tailscale serve). Uses a dedicated HTTPS port equal to the MCP port, so any serve config on 443 is untouched.",
        kind: "toggle",
      },
    ],
  },
  {
    title: "Authentication",
    col: "a",
    fields: [
      {
        key: "UNRAID_MCP_BEARER_TOKEN",
        label: "Bearer token",
        help: "Pre-shared token MCP clients send as Authorization: Bearer <token>. Auto-generated at install.",
        kind: "secret",
      },
      {
        key: "UNRAID_MCP_DISABLE_HTTP_AUTH",
        label: "Disable HTTP auth",
        help: "Only behind a trusted authenticating gateway. With a non-loopback bind host this also requires Trust proxy.",
        kind: "toggle",
      },
      {
        key: "UNRAID_MCP_TRUST_PROXY",
        label: "Trust proxy",
        help: "Confirms an upstream gateway (SWAG/Authelia) enforces authentication when HTTP auth is disabled.",
        kind: "toggle",
      },
    ],
  },
  {
    title: "Tuning",
    col: "b",
    fields: [
      {
        key: "UNRAID_MCP_LOG_LEVEL",
        label: "Log level",
        help: "Server log verbosity. Logs land in /var/log/unraid-mcp/server.log.",
        kind: "select",
        options: ["DEBUG", "INFO", "WARNING", "ERROR"],
      },
      {
        key: "UNRAID_MCP_MAX_RESPONSE_BYTES",
        label: "Response cap",
        help: "Backstop cap in bytes on serialized tool responses (default 40000 ≈ 10K tokens).",
        kind: "number",
        placeholder: "40000",
      },
      {
        key: "UNRAID_AUTO_START_SUBSCRIPTIONS",
        label: "Subscriptions",
        help: "Lazily start WebSocket subscriptions on first live-data access.",
        kind: "toggle",
      },
      {
        key: "UNRAID_MAX_RECONNECT_ATTEMPTS",
        label: "Reconnect limit",
        help: "WebSocket reconnect limit before a subscription is marked failed.",
        kind: "number",
        placeholder: "10",
      },
    ],
  },
  {
    title: "Subscription tuning",
    collapsed: true,
    col: "c",
    fields: [
      {
        key: "UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS",
        label: "Collect max events",
        help: "Bound on events retained while streaming a live collection call.",
        kind: "number",
        placeholder: "100",
      },
      {
        key: "UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES",
        label: "Collect max bytes",
        help: "Bound on bytes retained while streaming (default 1048576 = 1 MiB).",
        kind: "number",
        placeholder: "1048576",
      },
      {
        key: "UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS",
        label: "Collect max seconds",
        help: "Bound on duration of a live collection window.",
        kind: "number",
        placeholder: "30",
      },
      {
        key: "UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS",
        label: "Cache max age",
        help: "Cached subscription payloads older than this are not served.",
        kind: "number",
        placeholder: "300",
      },
      {
        key: "UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS",
        label: "Timeout cap",
        help: "Upper bound on per-call WebSocket timeout.",
        kind: "number",
        placeholder: "60",
      },
      {
        key: "UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE",
        label: "Raw probe",
        help: "Debug-only, data-sensitive raw frame in subscriptions/test_query. Never enable on shared deployments.",
        kind: "toggle",
      },
      {
        key: "UNRAID_MCP_LOG_FILE",
        label: "Log filename",
        help: "Log filename inside the server's logs directory (default unraid-mcp.log).",
        kind: "text",
        mono: true,
        placeholder: "unraid-mcp.log",
      },
    ],
  },
  {
    title: "Google OAuth (claude.ai)",
    col: "c",
    gated: true,
    fields: [
      {
        key: "UNRAID_MCP_GOOGLE_CLIENT_ID",
        label: "Client ID",
        help: "Google OAuth Web application client ID. Setting ID and secret enables OAuth for HTTP; an explicitly set bearer token stays valid alongside.",
        kind: "text",
        mono: true,
        placeholder: "1234.apps.googleusercontent.com",
      },
      {
        key: "UNRAID_MCP_GOOGLE_CLIENT_SECRET",
        label: "Client secret",
        help: "Google OAuth client secret (GOCSPX-…).",
        kind: "secret",
      },
      {
        key: "UNRAID_MCP_GOOGLE_BASE_URL",
        label: "Base URL",
        help: "This server's public https:// base URL; must match the client's authorized redirect URI host.",
        kind: "text",
        mono: true,
        placeholder: "https://mcp.example.com",
      },
      {
        key: "UNRAID_MCP_GOOGLE_ALLOWED_EMAILS",
        label: "Allowed emails",
        help: "Comma/space-separated verified Google emails allowed to sign in.",
        kind: "text",
        mono: true,
      },
      {
        key: "UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS",
        label: "Allowed domains",
        help: "Comma/space-separated verified email domains allowed to sign in.",
        kind: "text",
        mono: true,
      },
      {
        key: "UNRAID_MCP_GOOGLE_ALLOW_ANY_USER",
        label: "Allow any user",
        help: "Escape hatch for private deployments that intentionally allow any Google account.",
        kind: "toggle",
      },
      {
        key: "UNRAID_MCP_GOOGLE_REQUIRED_SCOPES",
        label: "Scopes",
        help: "OAuth scopes; default is openid + userinfo.email.",
        kind: "text",
        mono: true,
      },
      {
        key: "UNRAID_MCP_GOOGLE_REDIRECT_PATH",
        label: "Redirect path",
        help: "OAuth callback path; must match the Google client config (default /auth/callback).",
        kind: "text",
        mono: true,
        placeholder: "/auth/callback",
      },
      {
        key: "UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY",
        label: "JWT signing key",
        help: "With the encryption key, persists issued tokens across restarts.",
        kind: "secret",
      },
      {
        key: "UNRAID_MCP_GOOGLE_ENCRYPTION_KEY",
        label: "Encryption key",
        help: "Fernet key for encrypting persisted tokens at rest. Set both persistence keys or neither.",
        kind: "secret",
      },
      {
        key: "UNRAID_MCP_GOOGLE_STORAGE_DIR",
        label: "Token storage dir",
        help: "Directory for persisted encrypted tokens (default ~/.unraid-mcp/oauth-tokens).",
        kind: "text",
        mono: true,
      },
    ],
  },
];

