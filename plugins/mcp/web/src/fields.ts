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
  col: "a" | "b" | "c";
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
        help: "The local Unraid GraphQL endpoint. Detected automatically at install.",
        kind: "text",
        mono: true,
        placeholder: "http://127.0.0.1/graphql",
      },
      {
        key: "UNRAID_API_KEY",
        label: "API key",
        help: "Unraid API key. Auto-provisioned at install when possible.",
        kind: "secret",
      },
      {
        key: "UNRAID_API_SKIP_TLS_VERIFY",
        label: "Skip TLS verification",
        help: "Disable certificate verification for the Unraid API. Use only with a trusted private endpoint.",
        kind: "toggle",
      },
      {
        key: "UNRAID_API_CA_BUNDLE",
        label: "CA bundle path",
        help: "Path to a PEM bundle to trust for the Unraid API, e.g. /boot/config/ssl/certs/ca.pem. Prefer this over skipping verification for a private CA.",
        kind: "text",
      },
    ],
  },
  {
    title: "MCP server",
    col: "b",
    fields: [
      {
        key: "UNRAID_RMCP_HOST",
        label: "Bind host",
        help: "0.0.0.0 exposes runraid on all interfaces; bearer authentication protects the endpoint.",
        kind: "text",
        mono: true,
        placeholder: "0.0.0.0",
      },
      {
        key: "UNRAID_RMCP_PORT",
        label: "Port",
        help: "TCP port for the Rust MCP HTTP endpoint.",
        kind: "number",
        placeholder: "40010",
      },
      {
        key: "UNRAID_MCP_TAILSCALE_SERVE",
        label: "Tailscale Serve",
        help: "Publish /mcp on your tailnet as HTTPS using the official Tailscale plugin daemon.",
        kind: "toggle",
      },
      {
        key: "RUST_LOG",
        label: "Log level",
        help: "runraid log verbosity. Logs land in /var/log/unraid-mcp/server.log.",
        kind: "select",
        options: ["trace", "debug", "info", "warn", "error"],
      },
    ],
  },
  {
    title: "Authentication",
    col: "a",
    fields: [
      {
        key: "UNRAID_RMCP_AUTH_MODE",
        label: "Auth mode",
        help: "Bearer uses the static token below. OAuth enables the Google-backed authorization flow.",
        kind: "select",
        options: ["bearer", "oauth"],
      },
      {
        key: "UNRAID_RMCP_TOKEN",
        label: "Bearer token",
        help: "Pre-shared token MCP clients send as Authorization: Bearer <token>. Auto-generated at install.",
        kind: "secret",
      },
      {
        key: "UNRAID_RMCP_DISABLE_HTTP_AUTH",
        label: "Disable HTTP auth",
        help: "Safe only on loopback unless the explicit non-loopback acknowledgement is also enabled.",
        kind: "toggle",
      },
      {
        key: "UNRAID_NOAUTH",
        label: "Allow unauthenticated network bind",
        help: "Explicitly acknowledges that a non-loopback endpoint has no runraid authentication. Use only behind a trusted authenticating gateway.",
        kind: "toggle",
      },
      {
        key: "UNRAID_RMCP_ALLOWED_HOSTS",
        label: "Allowed hosts",
        help: "Optional comma-separated Host header allowlist.",
        kind: "text",
        mono: true,
      },
      {
        key: "UNRAID_RMCP_ALLOWED_ORIGINS",
        label: "Allowed origins",
        help: "Optional comma-separated CORS origin allowlist.",
        kind: "text",
        mono: true,
      },
    ],
  },
  {
    title: "Tool exposure",
    col: "b",
    fields: [
      {
        key: "UNRAID_RMCP_ENABLED_TOOLS",
        label: "Enabled tools",
        help: "Optional comma-separated allowlist of action names (for example array,docker) or *, unraid, or unraid.*. Empty exposes all actions not denied below.",
        kind: "text",
        mono: true,
        placeholder: "array,docker,status",
      },
      {
        key: "UNRAID_RMCP_DISABLED_TOOLS",
        label: "Disabled tools",
        help: "Optional comma-separated denylist. Deny selectors win when an action appears in both lists.",
        kind: "text",
        mono: true,
        placeholder: "vm_reset,array_stop",
      },
    ],
  },
  {
    title: "Google OAuth",
    col: "c",
    gated: true,
    fields: [
      {
        key: "UNRAID_RMCP_PUBLIC_URL",
        label: "Public URL",
        help: "The external HTTPS base URL used for OAuth metadata and callbacks.",
        kind: "text",
        mono: true,
        placeholder: "https://mcp.example.com",
      },
      {
        key: "UNRAID_RMCP_GOOGLE_CLIENT_ID",
        label: "Google client ID",
        help: "OAuth Web application client ID.",
        kind: "text",
        mono: true,
        placeholder: "1234.apps.googleusercontent.com",
      },
      {
        key: "UNRAID_RMCP_GOOGLE_CLIENT_SECRET",
        label: "Google client secret",
        help: "OAuth client secret.",
        kind: "secret",
      },
      {
        key: "UNRAID_RMCP_AUTH_ADMIN_EMAIL",
        label: "Admin email",
        help: "Google account granted the unraid:admin scope. Required in OAuth mode.",
        kind: "text",
        mono: true,
      },
    ],
  },
];
