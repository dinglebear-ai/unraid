import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { chmod, chown, mkdir, realpath, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { IncusUnixClient, type IncusResponse } from "./incus-unix-client.service.js";

export interface JailSummary {
  name: string;
  status: string;
  ipv4?: string;
  cpuUsageNs?: string;
  memoryUsageBytes?: string;
  memoryTotalBytes?: string;
}

interface IncusNetworkAddress {
  family?: string;
  address?: string;
}

interface IncusDevice extends Record<string, string | undefined> {
  type?: string;
  source?: string;
  path?: string;
  pool?: string;
  network?: string;
}

interface IncusInstance {
  name: string;
  status: string;
  profiles?: string[];
  state?: {
    network?: Record<string, { addresses?: IncusNetworkAddress[] }>;
    cpu?: { usage?: string | number };
    memory?: { usage?: string | number; total?: string | number };
  };
  config?: Record<string, string>;
  expanded_config?: Record<string, string>;
  devices?: Record<string, IncusDevice>;
  expanded_devices?: Record<string, IncusDevice>;
}

/**
 * Thin client for the Incus REST API over its local unix socket
 * ($INCUS_DIR/unix.socket). No `incus` CLI, no output scraping — Incus is
 * API-first, so we speak HTTP directly.
 */
@Injectable()
export class IncusService {
  private readonly logger = new Logger(IncusService.name);
  private jailSnapshot?: { expiresAt: number; value: Promise<JailSummary[]> };

  constructor(private readonly config: ConfigService, private readonly client: IncusUnixClient) {}

  /** Raw request against the Incus REST API. */
  private call<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    timeoutMs = 30_000
  ): Promise<IncusResponse<T>> {
    return this.client.request<T>(method, path, body, timeoutMs);
  }

  /** Wait for an async operation to complete. */
  private async waitForOperation(operationUrl: string, timeoutSec = 60): Promise<void> {
    // The HTTP request itself must be allowed to sit open at least as long as
    // the wait we're asking Incus to perform, plus slack for network/socket
    // overhead — otherwise a still-healthy, still-running operation gets
    // reported as a timeout when the socket is cut before Incus responds.
    await this.client.wait(operationUrl, timeoutSec);
  }

  /** Execute a call and wait if async. */
  private async callAndWait<T = unknown>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<IncusResponse<T>> {
    const resp = await this.call<T>(method, path, body);
    if (resp.type === "async" && resp.operation) {
      await this.waitForOperation(resp.operation);
    }
    if (method !== "GET" && path.startsWith("/1.0/instances")) {
      this.jailSnapshot = undefined;
    }
    return resp;
  }

  /** GET /1.0 — daemon reachable & basic info. */
  async ping(): Promise<boolean> {
    try {
      const resp = await this.call("GET", "/1.0");
      return resp.status_code === 200;
    } catch {
      return false;
    }
  }

  /** List jails (instances) with state, expanded to name/status/ipv4/resource usage. */
  async listJails(): Promise<JailSummary[]> {
    if (this.jailSnapshot && this.jailSnapshot.expiresAt > Date.now()) return this.jailSnapshot.value;
    const value = this.fetchJails();
    this.jailSnapshot = { expiresAt: Date.now() + 1_000, value };
    try { return await value; } catch (error) { this.jailSnapshot = undefined; throw error; }
  }

  private async fetchJails(): Promise<JailSummary[]> {
    const { metadata } = await this.call<IncusInstance[]>(
      "GET",
      "/1.0/instances?recursion=2"
    );
    return (metadata ?? []).map((i) => ({
      name: i.name,
      status: i.status,
      ipv4: i.state?.network?.eth0?.addresses?.find((address) => address.family === "inet")?.address,
      cpuUsageNs: i.state?.cpu?.usage === undefined ? undefined : String(i.state.cpu.usage),
      memoryUsageBytes: i.state?.memory?.usage === undefined ? undefined : String(i.state.memory.usage),
      memoryTotalBytes: i.state?.memory?.total === undefined ? undefined : String(i.state.memory.total),
    }));
  }

  /** Known public simplestreams remotes, matching the `incus` CLI's built-in aliases. */
  private static readonly KNOWN_REMOTES: Record<string, string> = {
    images: "images.linuxcontainers.org",
    ubuntu: "cloud-images.ubuntu.com/releases",
    "ubuntu-daily": "cloud-images.ubuntu.com/daily",
    "ubuntu-minimal": "cloud-images.ubuntu.com/minimal/releases",
  };

  /**
   * Launch a jail from an image using the configured agent-jail profile.
   *
   * `image` is either `remote:alias` (a known public simplestreams remote — the
   * `images:debian/trixie/cloud` default, or an explicit `ubuntu:noble` etc.) or a bare
   * alias with no colon, which means a LOCALLY-BUILT image already sitting in this
   * daemon's own image store (e.g. one built via buildJailImage/distrobuilder). Those
   * two cases need different `source` shapes — a local image has no `protocol`/`server`
   * at all (verified against the real Incus REST API: passing simplestreams fields for
   * a local-only alias makes Incus look for it on the PUBLIC remote and fail, since the
   * locally-built image was never published anywhere).
   */
  async launchJail(name: string, opts?: { image?: string; profile?: string }): Promise<void> {
    this.assertJailName(name);
    const image = opts?.image ?? this.config.get<string>("incus.jailImage", "images:debian/trixie/cloud");
    const profile = opts?.profile ?? this.config.get<string>("incus.jailProfile", "agent-jail");
    const colonIdx = image.indexOf(":");

    let source: Record<string, unknown>;
    if (colonIdx > 0) {
      const remote = image.substring(0, colonIdx);
      const alias = image.substring(colonIdx + 1);
      const server = IncusService.KNOWN_REMOTES[remote];
      if (!server) {
        throw new Error(
          `Unknown image remote "${remote}" in "${image}" — known remotes: ${Object.keys(IncusService.KNOWN_REMOTES).join(", ")}`
        );
      }
      source = { type: "image", protocol: "simplestreams", server: `https://${server}`, alias };
    } else {
      // No colon — a locally-built image alias, resolved against this daemon's own store.
      source = { type: "image", alias: image };
    }

    // The agent-jail profile's own `workspace` device points every instance at one shared
    // "default-workspace" directory (see agent-jail-profile.yaml.tmpl) — fine for a single
    // container, but it means two containers launched from the same image would silently
    // share (not clone) the same live directory. Give each launch its own subdirectory of
    // the configured workspace root by default, overriding the profile's device just for
    // this instance, so concurrent containers never see each other's files. The root
    // filesystem itself doesn't need this treatment — Incus already provisions an
    // independent storage volume per instance for that.
    const instanceWorkspace = await this.ensureInstanceWorkspaceDir(name);

    await this.callAndWait("POST", "/1.0/instances", {
      name,
      type: "container",
      profiles: ["default", profile],
      source,
      devices: {
        workspace: { type: "disk", source: instanceWorkspace, path: "/workspace", shift: "true" },
      },
    });
    await this.callAndWait("PUT", `/1.0/instances/${encodeURIComponent(name)}/state`, {
      action: "start",
      timeout: 30,
    });
  }

  /** start | stop | restart | freeze | unfreeze. */
  async setState(name: string, action: "start" | "stop" | "restart" | "freeze" | "unfreeze"): Promise<void> {
    await this.callAndWait("PUT", `/1.0/instances/${encodeURIComponent(name)}/state`, {
      action,
      timeout: action === "stop" ? 30 : 15,
      force: action === "stop",
    });
  }

  async deleteJail(name: string): Promise<void> {
    // Best-effort stop before delete
    try {
      await this.callAndWait("PUT", `/1.0/instances/${encodeURIComponent(name)}/state`, {
        action: "stop",
        timeout: 15,
        force: true,
      });
    } catch {
      // Container may already be stopped
    }
    await this.callAndWait("DELETE", `/1.0/instances/${encodeURIComponent(name)}`);
  }

  /**
   * Delete every currently-stopped container. Intentionally never touches a running one —
   * "cleanup" should never be a way to accidentally kill something live. Each deletion is
   * independent: one failure doesn't stop the rest, and the names that actually got deleted
   * are returned so the caller can report exactly what happened.
   */
  async deleteStoppedJails(): Promise<string[]> {
    const jails = await this.listJails();
    const stopped = jails.filter((j) => j.status.toLowerCase() === "stopped");
    const deleted: string[] = [];
    for (const jail of stopped) {
      try {
        await this.callAndWait("DELETE", `/1.0/instances/${encodeURIComponent(jail.name)}`);
        deleted.push(jail.name);
      } catch (e) {
        this.logger.warn(`Failed to delete stopped container "${jail.name}": ${(e as Error).message}`);
      }
    }
    return deleted;
  }

  /** Whether an image alias still resolves against this daemon's own store. */
  async imageExists(alias: string): Promise<boolean> {
    try {
      await this.call("GET", `/1.0/images/aliases/${encodeURIComponent(alias)}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete an image by alias. Incus deletes images by fingerprint, not alias
   * name, so this resolves the alias to its target fingerprint first — the
   * same two-step lookup the `incus image delete <alias>` CLI performs
   * internally. Deleting the image cascades to remove any aliases pointing
   * at it, so no separate alias-delete call is needed.
   */
  async deleteImage(alias: string): Promise<void> {
    const { metadata } = await this.call<{ target: string }>(
      "GET",
      `/1.0/images/aliases/${encodeURIComponent(alias)}`
    );
    await this.callAndWait("DELETE", `/1.0/images/${encodeURIComponent(metadata.target)}`);
  }

  /** Resolve + create `${jailWorkspaceRoot}/${name}`, guarding against the name escaping the root. */
  private async ensureInstanceWorkspaceDir(name: string): Promise<string> {
    this.assertJailName(name);
    const workspaceRoot = await this.canonicalWorkspaceRoot();
    const instanceWorkspace = resolve(join(workspaceRoot, name));
    if (!this.isContained(workspaceRoot, instanceWorkspace)) {
      throw new Error(`Container name "${name}" produces an invalid workspace path`);
    }
    await mkdir(instanceWorkspace, { recursive: true });
    const uid = Number.parseInt(this.config.get<string>("incus.jailAgentUid", "1000"), 10);
    const gid = Number.parseInt(this.config.get<string>("incus.jailAgentGid", "1000"), 10);
    if (!Number.isSafeInteger(uid) || uid < 0 || !Number.isSafeInteger(gid) || gid < 0) {
      throw new Error("Configured agent UID/GID is invalid");
    }
    await chown(instanceWorkspace, uid, gid);
    await chmod(instanceWorkspace, 0o750);
    return realpath(instanceWorkspace);
  }

  /**
   * Give an already-running container (launched before per-instance workspaces existed, or
   * one still explicitly reset to "use profile default") its own isolated workspace, matching
   * what a fresh launchJail call gets automatically. This does NOT copy any files already
   * sitting in the old shared directory — it points /workspace at a new, empty, per-container
   * directory going forward. Old data stays exactly where it was on the host, just unmounted.
   */
  async migrateToOwnWorkspace(name: string): Promise<string> {
    const instanceWorkspace = await this.ensureInstanceWorkspaceDir(name);
    await this.setWorkspace(name, instanceWorkspace);
    return instanceWorkspace;
  }

  /** Repoint a jail's workspace disk device to a host directory (bring-your-cwd). */
  async setWorkspace(name: string, hostPath: string): Promise<void> {
    const workspaceRoot = await this.canonicalWorkspaceRoot();
    const canonical = await realpath(hostPath);
    if (!this.isContained(workspaceRoot, canonical)) throw new Error(`Workspace must be beneath ${workspaceRoot}`);
    if (!(await stat(canonical)).isDirectory()) throw new Error("Workspace source must be a directory");
    const { metadata: inst } = await this.call<IncusInstance>(
      "GET",
      `/1.0/instances/${encodeURIComponent(name)}`
    );
    const devices = { ...(inst.devices ?? {}) };
    // Re-resolve immediately before passing the path across the privilege boundary.
    const verified = await realpath(canonical);
    if (verified !== canonical || !this.isContained(workspaceRoot, verified)) throw new Error("Workspace path changed during validation");
    devices.workspace = { type: "disk", source: verified, path: "/workspace", shift: "true" };
    await this.callAndWait("PATCH", `/1.0/instances/${encodeURIComponent(name)}`, { devices });
  }

  private async canonicalWorkspaceRoot(): Promise<string> {
    const configured = resolve(this.config.get<string>("incus.jailWorkspaceRoot", "/srv/agent-jails"));
    await mkdir(configured, { recursive: true });
    return realpath(configured);
  }

  private isContained(root: string, candidate: string): boolean {
    const rel = relative(root, candidate);
    return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
  }

  private assertJailName(name: string): void {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,62}$/.test(name)) throw new Error("Invalid container name");
  }

  /** Drop the instance-level workspace override so it falls back to the profile's own device. */
  async clearWorkspaceOverride(name: string): Promise<void> {
    const { metadata: inst } = await this.call<IncusInstance>(
      "GET",
      `/1.0/instances/${encodeURIComponent(name)}`
    );
    const devices = { ...(inst.devices ?? {}) };
    delete devices.workspace;
    // PATCH replaces the whole `devices` map, not a per-key merge, so omitting the key here
    // is what actually removes the override (an empty-string value would not).
    await this.callAndWait("PATCH", `/1.0/instances/${encodeURIComponent(name)}`, { devices });
  }

  /**
   * Override this instance's CPU/memory limits, independent of the profile's own
   * limits.cpu/limits.memory. Pass an empty string to clear an override and fall back
   * to the profile's value again — Incus's own config-unset semantics for a config key.
   */
  async setJailLimits(name: string, cpu?: string, memory?: string): Promise<void> {
    const { metadata: inst } = await this.call<IncusInstance>(
      "GET",
      `/1.0/instances/${encodeURIComponent(name)}`
    );
    const config = { ...(inst.config ?? {}) };
    if (cpu !== undefined) config["limits.cpu"] = cpu;
    if (memory !== undefined) config["limits.memory"] = memory;
    await this.callAndWait("PATCH", `/1.0/instances/${encodeURIComponent(name)}`, { config });
  }

  /**
   * Full resolved config for one jail — profile + instance overrides already merged by
   * Incus (`expanded_config`/`expanded_devices`), plus which values are instance-level
   * overrides vs inherited from the profile (present in the unexpanded `config`/`devices`).
   */
  async getJailDetail(name: string): Promise<{
    name: string;
    profiles: string[];
    imageOs?: string;
    imageRelease?: string;
    imageDescription?: string;
    storagePool?: string;
    networkBridge?: string;
    cpuLimit?: string;
    cpuLimitIsOverride: boolean;
    memoryLimit?: string;
    memoryLimitIsOverride: boolean;
    workspaceHostPath?: string;
    workspaceIsOverride: boolean;
  }> {
    const { metadata: inst } = await this.call<IncusInstance>(
      "GET",
      `/1.0/instances/${encodeURIComponent(name)}`
    );
    const expandedConfig = inst.expanded_config ?? {};
    const expandedDevices = inst.expanded_devices ?? {};
    const ownConfig = inst.config ?? {};
    const ownDevices = inst.devices ?? {};
    return {
      name: inst.name,
      profiles: inst.profiles ?? [],
      imageOs: expandedConfig["image.os"],
      imageRelease: expandedConfig["image.release"],
      imageDescription: expandedConfig["image.description"],
      storagePool: expandedDevices.root?.pool,
      networkBridge: expandedDevices.eth0?.network,
      cpuLimit: expandedConfig["limits.cpu"],
      cpuLimitIsOverride: ownConfig["limits.cpu"] !== undefined,
      memoryLimit: expandedConfig["limits.memory"],
      memoryLimitIsOverride: ownConfig["limits.memory"] !== undefined,
      workspaceHostPath: expandedDevices.workspace?.source,
      workspaceIsOverride: ownDevices.workspace !== undefined,
    };
  }
}
