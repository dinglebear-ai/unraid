import type { IncusConfig } from "../types";

/** Build the mutation payload without ever echoing the server's secret state. */
export function buildConfigUpdate(
  config: IncusConfig,
  secret: { replacement: string; clear: boolean }
): Record<string, unknown> {
  const { tsAuthKeyConfigured: _configured, ...publicConfig } = config;
  const failClosedConfig = { ...publicConfig, jailIpv6: "none" };
  if (secret.clear) return { ...failClosedConfig, tsAuthKey: "" };
  if (secret.replacement) return { ...failClosedConfig, tsAuthKey: secret.replacement };
  return failClosedConfig;
}
