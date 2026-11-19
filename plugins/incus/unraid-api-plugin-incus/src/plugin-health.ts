import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { IncusPluginHealth } from "./config.entity.js";

/**
 * The classic plugin's shell scripts (rc.incus, the array-start hook,
 * incus-init.sh, the watchdog) write `$INCUS_DIR/plugin-health` through
 * `scripts/incus-health.sh`: four `key=value` lines. `incusHealthy` only says
 * whether the daemon socket answers; this file also says whether the jail
 * environment (ACL, bridge, profile) was reconciled.
 */
export const PLUGIN_HEALTH_FILE = "plugin-health";

export function parsePluginHealth(text: string): IncusPluginHealth | null {
  const fields = new Map<string, string>();
  for (const line of text.split("\n")) {
    const separator = line.indexOf("=");
    if (separator > 0) fields.set(line.slice(0, separator), line.slice(separator + 1).trim());
  }
  const status = fields.get("status");
  if (!status) return null;
  return {
    status,
    message: fields.get("message") ?? "",
    time: fields.get("time") || undefined,
    build: fields.get("build") || undefined,
  };
}

/** Returns null when the file does not exist yet (the daemon never started). */
export async function readPluginHealth(stateDir: string): Promise<IncusPluginHealth | null> {
  try {
    return parsePluginHealth(await readFile(join(stateDir, PLUGIN_HEALTH_FILE), "utf-8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
