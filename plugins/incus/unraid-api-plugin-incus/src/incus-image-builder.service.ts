import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, writeFile, open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ImageRecord } from "./config.entity.js";
import { JsonArrayStore } from "./json-store.js";

export type ImageBuildStatusValue = "queued" | "running" | "success" | "failed";

export interface ImageBuild {
  id: string;
  status: ImageBuildStatusValue;
  alias: string;
  distro: string;
  release: string;
  packages: string[];
  logFile: string;
  error?: string;
  startedAt: number;
  finishedAt?: number;
  basedOn?: string;
}

const LOG_TAIL_BYTES = 16_384;
const MAX_CONCURRENT_BUILDS = 2;
const MAX_QUEUED_BUILDS = 8;
const BUILD_RETENTION_MS = 24 * 60 * 60 * 1000;
const BUILD_TIMEOUT_MS = 60 * 60 * 1000;
const BUILD_KILL_GRACE_MS = 10_000;
const BUILD_HARD_SETTLE_MS = 5_000;
const MAX_BUILD_LOG_BYTES = 16 * 1024 * 1024;

/** Private-prefixed runtime bundled by the plugin's .plg (see incus-env.sh) — matches incusd/lxcfs/nft. */
const INCUS_PREFIX = "/usr/local/incus";
const DISTROBUILDER_ENV_ALLOWLIST = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
  "LANG",
  "LC_ALL",
  "SSL_CERT_DIR",
  "SSL_CERT_FILE",
  "TMPDIR",
] as const;
const BUILD_SECRET_ASSIGNMENT =
  /((?:^|[\s{,])["']?(?:[A-Za-z0-9_.-]*[_-])?(?:password|token|secret|api[_-]?key|auth[_-]?key|private[_-]?key|authorization)["']?\s*[:=]\s*["']?)([^"'\s,;}\]]+)/gi;

export function distrobuilderEnvironment(
  parentEnv: NodeJS.ProcessEnv,
  socketPath: string,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    HOME: "/root",
    INCUS_SOCKET: socketPath,
    PATH: `${INCUS_PREFIX}/bin:${parentEnv.PATH ?? "/usr/bin:/bin"}`,
    LD_LIBRARY_PATH: `${INCUS_PREFIX}/lib${parentEnv.LD_LIBRARY_PATH ? ":" + parentEnv.LD_LIBRARY_PATH : ""}`,
    DEBOOTSTRAP_DIR: `${INCUS_PREFIX}/share/debootstrap`,
  };
  for (const key of DISTROBUILDER_ENV_ALLOWLIST) {
    const value = parentEnv[key];
    if (!value) continue;
    if (/proxy$/i.test(key) && key.toLowerCase() !== "no_proxy") {
      try {
        const proxy = new URL(value);
        if (proxy.username || proxy.password) continue;
      } catch {
        continue;
      }
    }
    env[key] = value;
  }
  return env;
}

export function redactBuildLogText(value: string): string {
  return value
    .replace(/(https?:\/\/)[^/@\s:]+:[^/@\s]+@/gi, "$1[REDACTED]@")
    .replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [REDACTED]")
    .replace(/\b(?:sk-(?:proj-)?|gh[pousr]_|github_pat_|tskey-)[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]")
    .replace(BUILD_SECRET_ASSIGNMENT, "$1[REDACTED]");
}

/**
 * Per-distro distrobuilder `source`/`packages` shape for the 6 distros curated in the
 * frontend dropdown (see web/src/App.vue CURATED_DISTROS). Verified against the real,
 * currently-maintained reference definitions distrobuilder's own maintainers use to build
 * images.linuxcontainers.org: github.com/lxc/lxc-ci, images/{debian,ubuntu,alpine,
 * rockylinux,almalinux,fedora}.yaml (fetched 2026-07). Downloader names cross-checked
 * against the `downloaders` registry in github.com/lxc/distrobuilder sources/source.go.
 *
 * - debian/ubuntu: `debootstrap` needs a mirror `url` and a `same_as` fallback script name
 *   (their debootstrap script directory may lag the very latest release/codename).
 * - alpinelinux: its own `alpinelinux-http` downloader, also mirror `url` + `same_as`.
 * - rockylinux/almalinux: `rockylinux-http`/`almalinux-http`, mirror `url`, no `same_as`
 *   (release comes straight from `image.release`).
 * - fedora: `fedora-http`, fixed koji `url`, no `same_as`/`variant` (release-driven too).
 */
const DISTRO_DEFINITIONS: Record<
  string,
  { downloader: string; manager: string; architecture: string; sourceExtra?: Record<string, string> }
> = {
  // Debian/Ubuntu's debootstrap wants the Debian-alias arch name ("amd64");
  // every other family here downloads from mirrors keyed by the native
  // uname-style name ("x86_64") — verified live: Alpine's downloader builds
  // its mirror URL directly from `image.architecture` and silently produces
  // a broken URL (missing version segment) when given "amd64" instead.
  // NOTE: intentionally no `same_as` fallback here — distrobuilder's debootstrap
  // downloader hardcodes `/usr/share/debootstrap/scripts` as the location it tries
  // to write the same_as symlink into, ignoring our DEBOOTSTRAP_DIR env override
  // (verified live: fails with "Failed to create symlink: ... /usr/share/debootstrap/
  // scripts/<release>: no such file or directory" since that system path doesn't
  // exist on a bare Unraid box). Every curated release must instead have a real
  // script (or symlink) present under the bundled
  // source/usr/local/incus/share/debootstrap/scripts/ directory — see that dir's
  // git history for how e.g. Ubuntu's "resolute" (26.04) was added as a symlink
  // to "gutsy", the base script every modern Ubuntu release script points to.
  debian: {
    downloader: "debootstrap",
    manager: "apt",
    architecture: "amd64",
    sourceExtra: { url: "https://deb.debian.org/debian/" },
  },
  ubuntu: {
    downloader: "debootstrap",
    manager: "apt",
    architecture: "amd64",
    sourceExtra: { url: "http://archive.ubuntu.com/ubuntu/" },
  },
  alpinelinux: {
    downloader: "alpinelinux-http",
    manager: "apk",
    architecture: "x86_64",
    sourceExtra: { url: "https://mirror.csclub.uwaterloo.ca/alpine/" },
  },
  rockylinux: {
    downloader: "rockylinux-http",
    manager: "yum",
    architecture: "x86_64",
    sourceExtra: { url: "https://download.rockylinux.org/pub/rocky/" },
  },
  almalinux: {
    downloader: "almalinux-http",
    manager: "yum",
    architecture: "x86_64",
    sourceExtra: { url: "https://almalinux.savoirfairelinux.net" },
  },
  fedora: {
    downloader: "fedora-http",
    manager: "dnf",
    architecture: "x86_64",
    sourceExtra: { url: "https://kojipkgs.fedoraproject.org" },
  },
};

/**
 * Builds custom Incus images with distrobuilder and imports them into the
 * local Incus daemon so they can be used as `jailImage` for new jails.
 *
 * distrobuilder is a separate tool from incus/incusd — it has no daemon and
 * no REST API, only a CLI that reads a YAML "definition" file describing a
 * distro + packages and produces a rootfs (and, for `build-incus`, an
 * Incus-flavoured metadata.yaml) tarball. `build-incus` supports
 * `--import-into-incus`, which imports the freshly built image straight into
 * the local Incus store (talking to the same unix socket IncusService uses),
 * so we don't need a separate `incus image import` shell-out.
 *
 * Builds run as detached child processes tracked in an in-memory Map (build
 * id -> status). There's no persistence: a plugin/API restart loses in-flight
 * build state, which is acceptable for this feature (re-run the build).
 */
@Injectable()
export class IncusImageBuilderService {
  private readonly logger = new Logger(IncusImageBuilderService.name);
  private readonly builds = new Map<string, ImageBuild>();
  private readonly imageStore: JsonArrayStore<ImageRecord>;
  private activeBuilds = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly config: ConfigService) {
    this.imageStore = new JsonArrayStore(() => this.imagesFilePath, isImageRecord);
  }

  private get socketPath(): string {
    const dir = this.config.get<string>("incus.stateDir", "/mnt/user/appdata/incus");
    return `${dir}/unix.socket`;
  }

  private get buildRoot(): string {
    const dir = this.config.get<string>("incus.stateDir", "/mnt/user/appdata/incus");
    return join(dir, "image-builds");
  }

  private get imagesFilePath(): string {
    const dir = this.config.get<string>("incus.stateDir", "/mnt/user/appdata/incus");
    return join(dir, "image-builds.json");
  }

  /** Kick off a build in the background; returns immediately with a build id. */
  async startBuild(
    distro: string,
    release: string,
    packages: string[],
    alias: string,
    basedOn?: string,
    postInstallCommands?: string[]
  ): Promise<string> {
    validateBuildInput(distro, release, packages, alias, postInstallCommands ?? []);
    if (this.queue.length >= MAX_QUEUED_BUILDS) throw new Error("Image build queue is full; wait for a running build to finish");
    await this.pruneBuildHistory();
    const id = randomUUID();
    await mkdir(this.buildRoot, { recursive: true });
    const workDir = await mkdtemp(join(tmpdir(), `distrobuilder-${id}-`));
    const definitionPath = join(workDir, "definition.yaml");
    const outputDir = join(workDir, "output");
    await mkdir(outputDir, { recursive: true });
    const logFile = join(this.buildRoot, `${id}.log`);

    await writeFile(
      definitionPath,
      this.renderDefinition(distro, release, packages, postInstallCommands ?? []),
      "utf-8"
    );
    await writeFile(logFile, "", { encoding: "utf-8", mode: 0o600, flag: "wx" });

    const build: ImageBuild = {
      id,
      status: "queued",
      alias,
      distro,
      release,
      packages,
      logFile,
      startedAt: Date.now(),
      basedOn,
    };
    this.builds.set(id, build);

    void this.enqueue(() => this.runBuild(build, definitionPath, outputDir));
    return id;
  }

  /** Full persisted image registry (empty array if no builds have succeeded yet). */
  async listImages(): Promise<ImageRecord[]> {
    return this.imageStore.read();
  }

  /** Flip a persisted image record's isMaster flag; throws if the alias isn't tracked. */
  /**
   * Exactly one image can be the golden master at a time — setting one clears the flag
   * on every other tracked image, so "master" always means "the current default", not
   * an arbitrary set of favorites.
   */
  async setMasterImage(alias: string, isMaster: boolean): Promise<ImageRecord> {
    return this.imageStore.update((images) => {
      const record = images.find((i) => i.alias === alias);
      if (!record) throw new Error(`No tracked image with alias "${alias}"`);
      if (isMaster) for (const image of images) image.isMaster = image.alias === alias;
      else record.isMaster = false;
      return record;
    });
  }

  /** Remove a tracked image record by alias. Returns whether one was actually removed. */
  async untrackImage(alias: string): Promise<boolean> {
    return this.imageStore.update((images) => {
      const idx = images.findIndex((i) => i.alias === alias);
      if (idx < 0) return false;
      images.splice(idx, 1);
      return true;
    });
  }

  private async recordImageBuilt(build: ImageBuild): Promise<void> {
    await this.imageStore.update((images) => {
      const record = {
        alias: build.alias, distro: build.distro, release: build.release,
        packages: build.packages, isMaster: false, basedOn: build.basedOn,
        createdAt: new Date().toISOString(),
      };
      const existing = images.findIndex((image) => image.alias === build.alias);
      if (existing >= 0) images[existing] = record;
      else images.push(record);
    });
  }

  /** Current status of a build, including a tail of its log. */
  async getStatus(buildId: string): Promise<(ImageBuild & { logTail: string }) | undefined> {
    const build = this.builds.get(buildId);
    if (!build) return undefined;
    const logTail = await this.tailLog(build.logFile);
    return { ...build, logTail };
  }

  /**
   * Minimal, correct distrobuilder LXC/Incus image definition: distro + release + packages.
   *
   * For the 6 curated distros (see DISTRO_DEFINITIONS), the real downloader/package-manager/
   * source fields verified against upstream lxc-ci are used. For anything else — e.g. the
   * frontend's "Other… (custom)" escape hatch — falls back to the previous generic
   * best-effort behavior (debootstrap for debian/ubuntu-like distros, else a bare
   * `downloader: distro` placeholder the caller is expected to already know is wrong for
   * their custom distro, plus apt as the package manager guess).
   */
  renderDefinition(
    distro: string,
    release: string,
    packages: string[],
    postInstallCommands: string[]
  ): string {
    const known = DISTRO_DEFINITIONS[distro];
    const downloader = known?.downloader ?? (distro === "ubuntu" || distro === "debian" ? "debootstrap" : "distro");
    const manager = known?.manager ?? "apt";
    // Debian/Ubuntu's debootstrap needs the Debian-alias name ("amd64"); every
    // other verified downloader here builds mirror URLs straight from this
    // field and needs the native uname-style name ("x86_64") instead — this
    // host has no `dpkg` to auto-detect it, so it must be set explicitly.
    const architecture = known?.architecture ?? "amd64";
    const sourceExtra = known?.sourceExtra ?? (known ? undefined : { same_as: release });

    const lines = [
      "image:",
      `  distribution: "${distro}"`,
      `  release: "${release}"`,
      `  architecture: ${architecture}`,
      `  description: "${distro} ${release} agent jail image (built via unraid incus plugin)"`,
      "",
      "source:",
      `  downloader: ${downloader}`,
      ...Object.entries(sourceExtra ?? {}).map(([key, value]) => `  ${key}: ${value}`),
      "",
      "packages:",
      `  manager: ${manager}`,
      "  update: true",
      "  cleanup: true",
      "  sets:",
      "  - action: install",
      "    packages:",
      ...packages.map((p) => `    - ${p}`),
      "",
      "targets:",
      // No fields are required here — this distrobuilder version rejects
      // unknown keys (e.g. the previously-used `incus_release` isn't a real
      // field of DefinitionTargetIncus and fails YAML unmarshalling).
      "  incus: {}",
      "",
    ];

    if (postInstallCommands.length > 0) {
      // distrobuilder writes `action` to a memfd and execs it directly (no shell
      // wrapper), so it MUST start with a shebang or it fails with "exec format
      // error" — verified against the real distrobuilder source (shared/util.go
      // RunScript). `post-packages` fires right after OS packages install (the
      // same trigger name confirmed in a real build's own log output), so
      // npm/pip/etc are already present by the time this runs.
      lines.push(
        "actions:",
        "- trigger: post-packages",
        "  action: |",
        "    #!/bin/sh",
        "    set -e",
        ...postInstallCommands.map((cmd) => `    ${cmd}`),
        ""
      );
    }

    return lines.join("\n");
  }

  private async runBuild(build: ImageBuild, definitionPath: string, outputDir: string): Promise<void> {
    build.status = "running";
    // --import-into-incus's VALUE *is* the resulting image alias (it's a Go
    // template string rendered against the definition, not a boolean flag —
    // verified against the real distrobuilder 3.2 CLI, which requires an
    // explicit argument here and has no separate --alias/-o mechanism for
    // naming the imported image).
    const args = ["build-incus", definitionPath, outputDir, `--import-into-incus=${build.alias}`];
    this.logger.log(`Starting distrobuilder build ${build.id}: distrobuilder ${args.join(" ")}`);

    // distrobuilder isn't a system package on Unraid — it (and the debootstrap
    // downloader it shells out to for debian/ubuntu, plus debootstrap's own
    // `ar` dependency) are bundled under the same private prefix as incusd/lxcfs.
    await new Promise<void>((resolvePromise) => {
      const child = spawn(`${INCUS_PREFIX}/bin/distrobuilder`, args, {
        // A dedicated process group lets timeout cancellation terminate
        // debootstrap/package-manager descendants as well as distrobuilder.
        detached: true,
        env: distrobuilderEnvironment(process.env, this.socketPath),
      });

      const log = createWriteStream(build.logFile, { flags: "a", mode: 0o600 });
      let logBytes = 0;
      let logTruncated = false;
      let pendingLogText = "";
      const writeRedactedLog = (text: string) => {
        if (logBytes >= MAX_BUILD_LOG_BYTES || !text) return;
        const encoded = Buffer.from(redactBuildLogText(text), "utf8");
        const remaining = MAX_BUILD_LOG_BYTES - logBytes;
        const output = encoded.subarray(0, remaining);
        logBytes += output.length;
        if (!log.write(output)) {
          child.stdout.pause();
          child.stderr.pause();
        }
        if (output.length < encoded.length && !logTruncated) {
          logTruncated = true;
          log.write("\n[build log truncated at 16 MiB]\n");
        }
      };
      const appendLog = (chunk: Buffer) => {
        pendingLogText += chunk.toString("utf8");
        const lastNewline = pendingLogText.lastIndexOf("\n");
        if (lastNewline >= 0) {
          writeRedactedLog(pendingLogText.slice(0, lastNewline + 1));
          pendingLogText = pendingLogText.slice(lastNewline + 1);
        }
        if (pendingLogText.length > 65_536) {
          writeRedactedLog(pendingLogText.slice(0, -512));
          pendingLogText = pendingLogText.slice(-512);
        }
      };
      log.on("drain", () => { child.stdout.resume(); child.stderr.resume(); });
      child.stdout.on("data", appendLog);
      child.stderr.on("data", appendLog);

      let settled = false;
      let forcedError: Error | undefined;
      let killTimer: ReturnType<typeof setTimeout> | undefined;
      let hardSettleTimer: ReturnType<typeof setTimeout> | undefined;
      const signalBuildGroup = (signal: NodeJS.Signals) => {
        try {
          if (child.pid) process.kill(-child.pid, signal);
          else child.kill(signal);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
            this.logger.warn(`Unable to signal build ${build.id} with ${signal}: ${(error as Error).message}`);
          }
        }
      };
      const timeout = setTimeout(() => {
        forcedError = new Error("Image build exceeded the 60 minute limit");
        signalBuildGroup("SIGTERM");
        killTimer = setTimeout(() => {
          signalBuildGroup("SIGKILL");
          // A broken child/process-wrapper can fail to emit close even after
          // SIGKILL. Settle independently so the build queue cannot remain
          // permanently occupied waiting for an event that never arrives.
          hardSettleTimer = setTimeout(() => void finish(null, forcedError), BUILD_HARD_SETTLE_MS);
        }, BUILD_KILL_GRACE_MS);
      }, BUILD_TIMEOUT_MS);
      const finish = async (code: number | null, error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (killTimer) clearTimeout(killTimer);
        if (hardSettleTimer) clearTimeout(hardSettleTimer);
        child.stdout.off("data", appendLog);
        child.stderr.off("data", appendLog);
        writeRedactedLog(pendingLogText);
        pendingLogText = "";
        log.end();
        const failure = error ?? forcedError;
        if (failure) {
          build.status = "failed";
          build.error = failure.message;
        } else if (code === 0) {
          build.status = "success";
          try {
            await this.recordImageBuilt(build);
          } catch (registryError) {
            build.status = "failed";
            build.error = `Image imported but registry update failed: ${(registryError as Error).message}`;
          }
        } else {
          build.status = "failed";
          build.error = `distrobuilder exited with code ${code}`;
        }
        build.finishedAt = Date.now();
        resolvePromise();
      };
      log.once("error", (error) => {
        forcedError = new Error(`Unable to write image build log: ${error.message}`);
        // Once the audit log is unavailable, continuing an unobserved build is
        // unsafe. Kill the whole detached group and release the queue slot.
        signalBuildGroup("SIGKILL");
        void finish(null, forcedError);
      });
      child.once("error", (error) => void finish(null, error));
      child.once("close", (code) => void finish(code));
    });

    // Best-effort cleanup of the scratch definition/output dir; the log file
    // under buildRoot is intentionally left behind for later status polling.
    await rm(join(definitionPath, ".."), { recursive: true, force: true }).catch(() => undefined);
  }

  private async tailLog(logFile: string): Promise<string> {
    let handle;
    try {
      handle = await open(logFile, "r");
      const { size } = await handle.stat();
      const length = Math.min(size, LOG_TAIL_BYTES);
      const data = Buffer.alloc(length);
      await handle.read(data, 0, length, Math.max(0, size - length));
      return data.toString("utf-8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") this.logger.warn(`Unable to read build log: ${(error as Error).message}`);
      return "";
    } finally {
      await handle?.close();
    }
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = () => {
        this.activeBuilds++;
        void task().then(resolve, reject).finally(() => {
          this.activeBuilds--;
          this.queue.shift()?.();
        });
      };
      if (this.activeBuilds < MAX_CONCURRENT_BUILDS) start();
      else this.queue.push(start);
    });
  }

  private async pruneBuildHistory(): Promise<void> {
    const cutoff = Date.now() - BUILD_RETENTION_MS;
    for (const [id, build] of this.builds) {
      if (build.finishedAt && build.finishedAt < cutoff) {
        this.builds.delete(id);
        await rm(build.logFile, { force: true }).catch((error) =>
          this.logger.warn(`Unable to remove expired build log ${build.logFile}: ${(error as Error).message}`)
        );
      }
    }
  }
}

function isImageRecord(value: unknown): value is ImageRecord {
  const item = value as Partial<ImageRecord> | null;
  return !!item && typeof item.alias === "string" && typeof item.distro === "string" &&
    typeof item.release === "string" && typeof item.isMaster === "boolean" && typeof item.createdAt === "string" &&
    Array.isArray(item.packages) && item.packages.every((p) => typeof p === "string");
}

function validateBuildInput(distro: string, release: string, packages: string[], alias: string, commands: string[]): void {
  const token = /^[A-Za-z0-9][A-Za-z0-9._+@/-]{0,127}$/;
  if (!token.test(distro) || !token.test(release) || !token.test(alias)) throw new Error("Invalid distro, release, or image alias");
  if (packages.length > 200 || commands.length > 50) throw new Error("Build input exceeds package or command limits");
  if (packages.some((value) => !token.test(value))) throw new Error("Invalid package name");
  if (commands.some((value) => value.length > 4096 || value.includes("\0"))) throw new Error("Invalid post-install command");
}
