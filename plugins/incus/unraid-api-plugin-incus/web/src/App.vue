<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { Button, Switch, Badge, Input, Select, Label, HelpText } from "./components/ui";
import TabNavigation from "./components/TabNavigation.vue";
import { gql } from "./graphql-client";
import { JOB_POLL_INTERVAL_MS, startPolling, type PollController } from "./lib/polling";
import { buildConfigUpdate } from "./lib/configPayload";
import { useResourceMetrics } from "./composables/useResourceMetrics";
import { useJailDetail } from "./composables/useJailDetail";
import {
  CONFIG_QUERY, STATUS_QUERY, UPDATE_CONFIG_MUTATION, SET_JAIL_STATE_MUTATION, DELETE_JAIL_MUTATION,
  LAUNCH_JAIL_MUTATION, JAIL_DETAIL_QUERY, GRANT_JAIL_SUDO_MUTATION, START_PRIVILEGED_COMMAND_MUTATION,
  PRIVILEGED_COMMAND_STATUS_QUERY, SET_JAIL_WORKSPACE_MUTATION, CLEAR_JAIL_WORKSPACE_MUTATION,
  SET_JAIL_LIMITS_MUTATION, BUILD_JAIL_IMAGE_MUTATION, DELETE_JAIL_IMAGE_MUTATION,
  SEARCH_ALL_PACKAGES_QUERY, BUILD_STATUS_QUERY, BUILDER_PRESETS_QUERY, SAVE_BUILDER_PRESET_MUTATION,
  DELETE_BUILDER_PRESET_MUTATION, JAIL_IMAGES_QUERY, SET_MASTER_IMAGE_MUTATION,
  PRUNE_STALE_IMAGE_RECORDS_MUTATION, DELETE_STOPPED_JAILS_MUTATION, MIGRATE_JAIL_WORKSPACE_MUTATION,
  INSTALL_HOMEBREW_FORMULA_MUTATION, HOMEBREW_INSTALL_STATUS_QUERY,
} from "./graphql/operations";
import type {
  IncusConfig,
  Jail,
  JailAction,
  JailDetail,
  HomebrewInstallStatus,
  PrivilegedCommandStatus,
  ImageBuildStatus,
  BuilderPreset,
  ImageRecord,
  DistroOption,
  PackageGroupOption,
  PackageEcosystem,
  PackageSearchResult,
  PackageSearchError,
} from "./types";

const Terminal = defineAsyncComponent(() => import("./components/Terminal.vue"));

type Tab = "builder" | "jails" | "config";
const activeTab = ref<Tab>("jails");
// Internal tab id stays "jails" (matches the rest of the codebase/GraphQL
// schema) — only the displayed label is reframed as "dev containers".

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const incusHealthy = ref(false);
const jails = ref<Jail[]>([]);
const newJailName = ref("");
const newJailNameError = computed(() => validateContainerName(newJailName.value));
const configCpuError = computed(() => validateCpuLimit(config.jailCpu));
const configMemoryError = computed(() => validateMemoryLimit(config.jailMemory));
const launchImageSelect = ref("");
const launchAllowSudo = ref(false);
const consoleJail = ref<string | null>(null);

const config = reactive<IncusConfig>({
  enabled: false,
  stateDir: "",
  storageDriver: "dir",
  storageSource: "",
  storagePoolName: "",
  jailBridge: "",
  jailSubnet: "",
  jailNat: true,
  jailIpv6: "none",
  aclName: "",
  aclBlock: "",
  aclAllow: "",
  aclDefaultEgress: "allow",
  aclDefaultIngress: "drop",
  jailProfile: "",
  jailImage: "",
  jailNesting: false,
  jailCpu: "",
  jailMemory: "",
  jailWorkspaceRoot: "",
  jailAgentUid: "",
  jailAgentGid: "",
  jailBindMounts: "",
  tsAuthKeyConfigured: false,
  dashboardWidgetEnable: true,
});

const {
  runningJails, stoppedJailsCount, totalMemoryUsageBytes, totalCpuUsageNs, fleetHistory,
  formatDuration, formatBytes, formatMemory, memoryFillPct, updateCpuSamplesAndHistory,
  cpuRateLabel, cpuRatePct, cpuRateSuffix, jailCpuHistory, totalCpuRateLabel, sparklinePoints,
} = useResourceMetrics(jails, () => config.jailCpu);

const isZfs = computed(() => config.storageDriver === "zfs");
const showTsAuthKey = ref(false);
const tsAuthKeyReplacement = ref("");
const clearTsAuthKeyOnSave = ref(false);
let componentActive = false;

async function loadConfig() {
  const data = await gql<{ incusConfig: IncusConfig }>(CONFIG_QUERY);
  if (!componentActive) return;
  Object.assign(config, data.incusConfig);
  // Legacy configs may predate fail-closed IPv6 enforcement. Never retain a
  // hidden non-none value behind the disabled control or submit it on Apply.
  config.jailIpv6 = "none";
}

let statusRequestId = 0;
async function refreshStatus() {
  const requestId = ++statusRequestId;
  try {
    const data = await gql<{ incusHealthy: boolean; jails: Jail[] }>(STATUS_QUERY);
    if (requestId !== statusRequestId) return;
    incusHealthy.value = data.incusHealthy;
    jails.value = data.jails;
    updateCpuSamplesAndHistory();
  } catch (e) {
    if (requestId !== statusRequestId) return;
    // Status is best-effort — don't block the rest of the page on it.
    incusHealthy.value = false;
  }
}

onMounted(async () => {
  componentActive = true;
  try {
    await loadConfig();
    if (!componentActive) return;
    await refreshStatus();
    if (!componentActive) return;
    await Promise.all([loadBuilderPresets(), loadJailImages()]);
  } catch (e) {
    if (!componentActive) return;
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    if (componentActive) loading.value = false;
  }
  if (componentActive && activeTab.value === "jails") startStatusPolling();
});

watch(activeTab, (tab) => {
  if (tab === "jails") {
    void refreshStatus();
    startStatusPolling();
  } else {
    stopStatusPolling();
  }
});

async function applySettings() {
  saving.value = true;
  error.value = null;
  try {
    const input = buildConfigUpdate(config, {
      replacement: tsAuthKeyReplacement.value,
      clear: clearTsAuthKeyOnSave.value,
    });
    await gql(UPDATE_CONFIG_MUTATION, { input });
    if (clearTsAuthKeyOnSave.value || tsAuthKeyReplacement.value) {
      config.tsAuthKeyConfigured = !clearTsAuthKeyOnSave.value;
      tsAuthKeyReplacement.value = "";
      clearTsAuthKeyOnSave.value = false;
    }
    await refreshStatus();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    saving.value = false;
  }
}

async function jailAction(name: string, action: JailAction) {
  error.value = null;
  try {
    await gql(SET_JAIL_STATE_MUTATION, { name, action });
    await refreshStatus();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function deleteJail(name: string) {
  if (!confirm(`Delete container "${name}"? This cannot be undone.`)) return;
  error.value = null;
  try {
    await gql(DELETE_JAIL_MUTATION, { name });
    await refreshStatus();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

const deletingStopped = ref(false);

async function deleteStoppedJails() {
  if (!confirm("Delete every stopped container? Running containers are never touched. This cannot be undone."))
    return;
  deletingStopped.value = true;
  error.value = null;
  try {
    const data = await gql<{ deleteStoppedJails: string[] }>(DELETE_STOPPED_JAILS_MUTATION);
    if (data.deleteStoppedJails.length === 0) {
      error.value = "No stopped containers to delete.";
    }
    await refreshStatus();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    deletingStopped.value = false;
  }
}

async function launchJail() {
  if (!newJailName.value.trim() || newJailNameError.value) return;
  error.value = null;
  try {
    await gql(LAUNCH_JAIL_MUTATION, {
      name: newJailName.value.trim(),
      image: launchImageSelect.value || null,
      allowSudo: launchAllowSudo.value,
    });
    newJailName.value = "";
    launchAllowSudo.value = false;
    await refreshStatus();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

// --- Container details panel: view/edit resolved per-jail config (limits, workspace) --

const detailSaving = ref(false);
const {
  detailsJailName, jailDetail, detailLoading, detailError,
  editCpuLimit, editMemoryLimit, editWorkspacePath,
  toggleJailDetails, loadJailDetail,
} = useJailDetail(() => {
  stopInstallPolling();
  installingFormula.value = false;
  stopPrivilegedPolling();
  runningPrivilegedCommand.value = false;
  installFormula.value = "";
  installResult.value = "";
  installError.value = "";
  privilegedCommand.value = "";
  privilegedCommandStatus.value = null;
});

// Each limit is applied independently (only the touched field is sent) so editing CPU
// alone doesn't also stamp an instance-level override onto an untouched Memory value.
async function saveJailCpuLimit() {
  if (!detailsJailName.value) return;
  const validationError = validateCpuLimit(editCpuLimit.value);
  if (validationError) {
    detailError.value = validationError;
    return;
  }
  detailSaving.value = true;
  detailError.value = "";
  try {
    await gql(SET_JAIL_LIMITS_MUTATION, { name: detailsJailName.value, cpu: editCpuLimit.value.trim() });
    await loadJailDetail(detailsJailName.value);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
  } finally {
    detailSaving.value = false;
  }
}

async function saveJailMemoryLimit() {
  if (!detailsJailName.value) return;
  const validationError = validateMemoryLimit(editMemoryLimit.value);
  if (validationError) {
    detailError.value = validationError;
    return;
  }
  detailSaving.value = true;
  detailError.value = "";
  try {
    await gql(SET_JAIL_LIMITS_MUTATION, { name: detailsJailName.value, memory: editMemoryLimit.value.trim() });
    await loadJailDetail(detailsJailName.value);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
  } finally {
    detailSaving.value = false;
  }
}

async function resetJailLimits() {
  if (!detailsJailName.value) return;
  editCpuLimit.value = "";
  editMemoryLimit.value = "";
  detailSaving.value = true;
  detailError.value = "";
  try {
    await gql(SET_JAIL_LIMITS_MUTATION, { name: detailsJailName.value, cpu: "", memory: "" });
    await loadJailDetail(detailsJailName.value);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
  } finally {
    detailSaving.value = false;
  }
}

async function saveJailWorkspace() {
  if (!detailsJailName.value || !editWorkspacePath.value.trim()) return;
  detailSaving.value = true;
  detailError.value = "";
  try {
    await gql(SET_JAIL_WORKSPACE_MUTATION, {
      name: detailsJailName.value,
      hostPath: editWorkspacePath.value.trim(),
    });
    await loadJailDetail(detailsJailName.value);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
  } finally {
    detailSaving.value = false;
  }
}

async function resetJailWorkspace() {
  if (!detailsJailName.value) return;
  detailSaving.value = true;
  detailError.value = "";
  try {
    await gql(CLEAR_JAIL_WORKSPACE_MUTATION, { name: detailsJailName.value });
    await loadJailDetail(detailsJailName.value);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
  } finally {
    detailSaving.value = false;
  }
}

// A container whose workspace isn't an instance-level override and whose path ends in
// the profile's shared "default-workspace" folder is sharing live data with every other
// container still on that default — worth calling out and offering a one-click fix.
function isOnSharedDefaultWorkspace(detail: JailDetail): boolean {
  return !detail.workspaceIsOverride && !!detail.workspaceHostPath?.endsWith("/default-workspace");
}

const migratingWorkspace = ref(false);

async function migrateJailWorkspace() {
  if (!detailsJailName.value) return;
  migratingWorkspace.value = true;
  detailError.value = "";
  try {
    await gql(MIGRATE_JAIL_WORKSPACE_MUTATION, { name: detailsJailName.value });
    await loadJailDetail(detailsJailName.value);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
  } finally {
    migratingWorkspace.value = false;
  }
}

// --- Homebrew post-launch install — best-effort exec into a running container --------
// Fire-and-poll, not a blocking mutation: bootstrapping Homebrew plus a formula install can
// comfortably outlast a browser/reverse-proxy request timeout (verified live — even the
// "hello" formula's blocking call hit an HTTP 504 while the install kept running server-side
// regardless). Mirrors the same startBuild/pollBuildStatus pattern already used for image builds.

const installFormula = ref("");
const installingFormula = ref(false);
const installResult = ref("");
const installError = ref("");
let installPollHandle: PollController | null = null;

function stopInstallPolling() {
  if (installPollHandle !== null) {
    installPollHandle.stop();
    installPollHandle = null;
  }
}

async function installHomebrewFormula() {
  if (!detailsJailName.value || !installFormula.value.trim()) return;
  const name = detailsJailName.value;
  stopInstallPolling();
  installingFormula.value = true;
  installResult.value = "";
  installError.value = "";
  try {
    const data = await gql<{ installHomebrewFormula: string }>(INSTALL_HOMEBREW_FORMULA_MUTATION, {
      name,
      formula: installFormula.value.trim(),
    });
    const jobId = data.installHomebrewFormula;
    installPollHandle = startPolling(async (pollContext) => {
      try {
        const poll = await gql<{ homebrewInstallStatus: HomebrewInstallStatus | null }>(
          HOMEBREW_INSTALL_STATUS_QUERY,
          { id: jobId }
        );
        if (!pollContext.isActive() || detailsJailName.value !== name) return;
        const job = poll.homebrewInstallStatus;
        if (!job || job.status === "running") return;
        stopInstallPolling();
        installingFormula.value = false;
        if (job.status === "success") {
          installResult.value = job.message;
          installFormula.value = "";
        } else {
          installError.value = job.message;
        }
      } catch (e) {
        if (!pollContext.isActive() || detailsJailName.value !== name) return;
        stopInstallPolling();
        installingFormula.value = false;
        installError.value = e instanceof Error ? e.message : String(e);
      }
    }, JOB_POLL_INTERVAL_MS);
  } catch (e) {
    installError.value = e instanceof Error ? e.message : String(e);
    installingFormula.value = false;
  }
}

// --- Sudo grant — opt-in, explicit, retroactive on an already-running container ------

const grantingSudo = ref(false);

async function grantJailSudo() {
  if (!detailsJailName.value) return;
  grantingSudo.value = true;
  detailError.value = "";
  try {
    await gql(GRANT_JAIL_SUDO_MUTATION, { name: detailsJailName.value });
    await loadJailDetail(detailsJailName.value);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
  } finally {
    grantingSudo.value = false;
  }
}

// --- Operator-mediated privileged command — runs as root, never exposed to the ---------
// container's own agent user. Same fire-and-poll shape as the Homebrew installer, for the
// same reason: an arbitrary command can easily outlast a blocking request's timeout.

const privilegedCommand = ref("");
const runningPrivilegedCommand = ref(false);
const privilegedCommandStatus = ref<PrivilegedCommandStatus | null>(null);
let privilegedPollHandle: PollController | null = null;

function stopPrivilegedPolling() {
  if (privilegedPollHandle !== null) {
    privilegedPollHandle.stop();
    privilegedPollHandle = null;
  }
}

async function runPrivilegedCommand() {
  if (!detailsJailName.value || !privilegedCommand.value.trim()) return;
  stopPrivilegedPolling();
  runningPrivilegedCommand.value = true;
  privilegedCommandStatus.value = null;
  detailError.value = "";
  try {
    const data = await gql<{ startPrivilegedCommand: string }>(START_PRIVILEGED_COMMAND_MUTATION, {
      name: detailsJailName.value,
      command: privilegedCommand.value.trim(),
    });
    const jobId = data.startPrivilegedCommand;
    const jailName = detailsJailName.value;
    privilegedPollHandle = startPolling(async (pollContext) => {
      try {
        const poll = await gql<{ privilegedCommandStatus: PrivilegedCommandStatus | null }>(
          PRIVILEGED_COMMAND_STATUS_QUERY,
          { id: jobId }
        );
        if (!pollContext.isActive() || detailsJailName.value !== jailName) return;
        const job = poll.privilegedCommandStatus;
        if (!job || job.status === "running") return;
        stopPrivilegedPolling();
        runningPrivilegedCommand.value = false;
        privilegedCommandStatus.value = job;
      } catch (e) {
        if (!pollContext.isActive() || detailsJailName.value !== jailName) return;
        stopPrivilegedPolling();
        runningPrivilegedCommand.value = false;
        detailError.value = e instanceof Error ? e.message : String(e);
      }
    }, JOB_POLL_INTERVAL_MS);
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : String(e);
    runningPrivilegedCommand.value = false;
  }
}

function statusBadgeVariant(status: string): "green" | "gray" | "orange" {
  const s = status.toLowerCase();
  if (s === "running") return "green";
  if (s === "stopped") return "gray";
  return "orange";
}

// --- Network / ACL status (from already-loaded config, no fabricated data) -

function parseCidrList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function blockedCidrCount(): number {
  return parseCidrList(config.aclBlock).length;
}

// CIDR chip editors for the two comma-separated ACL fields — lets the user add/remove
// one range at a time instead of hand-editing a raw comma-separated string.
const CIDR_PATTERN = /^[0-9a-fA-F:.]+\/\d{1,3}$/;

// Incus's own limits.cpu accepts a core count ("2") or a CPU set/range ("0-3", "0,2,4-5").
const CPU_LIMIT_PATTERN = /^\d+(-\d+)?(,\d+(-\d+)?)*$/;
// Incus's own limits.memory accepts a bare byte count or a number with a unit suffix.
const MEMORY_LIMIT_PATTERN = /^\d+(\.\d+)?(B|KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB|PiB)?$/i;
// Incus/LXC instance names follow hostname-like rules: alphanumeric and hyphens, must not
// start or end with a hyphen, max 63 characters.
const CONTAINER_NAME_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

function validateCpuLimit(value: string): string {
  if (!value.trim()) return "";
  return CPU_LIMIT_PATTERN.test(value.trim())
    ? ""
    : `"${value}" doesn't look like a CPU limit — expected a core count (e.g. 2) or a set/range (e.g. 0-3).`;
}

function validateMemoryLimit(value: string): string {
  if (!value.trim()) return "";
  return MEMORY_LIMIT_PATTERN.test(value.trim())
    ? ""
    : `"${value}" doesn't look like a memory limit — expected a byte count with an optional unit (e.g. 4GiB).`;
}

function validateContainerName(value: string): string {
  if (!value.trim()) return "";
  return CONTAINER_NAME_PATTERN.test(value.trim())
    ? ""
    : `"${value}" isn't a valid container name — letters, digits, and hyphens only, can't start or end with a hyphen.`;
}

const blockedCidrList = computed(() => parseCidrList(config.aclBlock));
const allowCidrList = computed(() => parseCidrList(config.aclAllow));
const newBlockedCidr = ref("");
const newAllowCidr = ref("");
const blockedCidrError = ref("");
const allowCidrError = ref("");

function addBlockedCidr(): void {
  const value = newBlockedCidr.value.trim();
  blockedCidrError.value = "";
  if (!value) return;
  if (!CIDR_PATTERN.test(value)) {
    blockedCidrError.value = `"${value}" doesn't look like a CIDR — expected e.g. 10.0.0.0/8 or fd00::/8.`;
    return;
  }
  if (blockedCidrList.value.includes(value)) {
    blockedCidrError.value = `${value} is already in the list.`;
    return;
  }
  config.aclBlock = [...blockedCidrList.value, value].join(",");
  newBlockedCidr.value = "";
}

function removeBlockedCidr(cidr: string): void {
  config.aclBlock = blockedCidrList.value.filter((c) => c !== cidr).join(",");
}

function addAllowCidr(): void {
  const value = newAllowCidr.value.trim();
  allowCidrError.value = "";
  if (!value) return;
  if (!CIDR_PATTERN.test(value)) {
    allowCidrError.value = `"${value}" doesn't look like a CIDR — expected e.g. 100.64.0.0/10 or fd00::/8.`;
    return;
  }
  if (allowCidrList.value.includes(value)) {
    allowCidrError.value = `${value} is already in the list.`;
    return;
  }
  config.aclAllow = [...allowCidrList.value, value].join(",");
  newAllowCidr.value = "";
}

function removeAllowCidr(cidr: string): void {
  config.aclAllow = allowCidrList.value.filter((c) => c !== cidr).join(",");
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    value = (value << 8) | n;
  }
  return value >>> 0;
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [subnetIp, prefixStr] = cidr.split("/");
  if (!subnetIp || prefixStr === undefined) return false;
  const prefix = Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  const ipInt = ipv4ToInt(ip);
  const subnetInt = ipv4ToInt(subnetIp);
  if (ipInt === null || subnetInt === null) return false;

  if (prefix === 0) return true;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (subnetInt & mask);
}

function jailOnBridgeSubnet(jail: Jail): boolean {
  if (!jail.ipv4 || !config.jailSubnet) return false;
  if (jail.status.toLowerCase() !== "running") return false;
  return ipInCidr(jail.ipv4, config.jailSubnet);
}

const POLL_INTERVAL_MS = 5000;
let pollHandle: PollController | null = null;

function startStatusPolling() {
  stopStatusPolling();
  pollHandle = startPolling(refreshStatus, POLL_INTERVAL_MS);
}

function stopStatusPolling() {
  if (pollHandle !== null) {
    pollHandle.stop();
    pollHandle = null;
  }
}

// --- Builder tab ----------------------------------------------------------

interface BuildRow {
  buildId: string;
  distro: string;
  release: string;
  alias: string;
  status: ImageBuildStatus | null;
  error: string | null;
  intervalId: PollController | null;
}

// --- Curated distro/release catalog ---------------------------------------
// Sourced from the real upstream image definitions distrobuilder itself is
// built from (github.com/lxc/lxc-ci, images/*.yaml — the exact set used to
// produce images.linuxcontainers.org), cross-checked against each distro's
// current release as of mid-2026. Values are exact `source`/`image` strings
// distrobuilder expects; labels are just for display. Kept intentionally
// short — a "Other… (custom)" escape hatch covers everything else
// distrobuilder supports that isn't listed here.
const OTHER_DISTRO = "__other__";
const OTHER_RELEASE = "__other__";

const CURATED_DISTROS: DistroOption[] = [
  { value: "debian", label: "Debian" },
  { value: "ubuntu", label: "Ubuntu" },
  { value: "alpinelinux", label: "Alpine Linux" },
  { value: "rockylinux", label: "Rocky Linux" },
  { value: "almalinux", label: "AlmaLinux" },
  { value: "fedora", label: "Fedora" },
];

const CURATED_RELEASES: Record<string, DistroOption[]> = {
  debian: [
    { value: "bookworm", label: "Bookworm (12, oldstable)" },
    { value: "trixie", label: "Trixie (13, stable)" },
    { value: "sid", label: "Sid (unstable)" },
  ],
  ubuntu: [
    { value: "jammy", label: "Jammy (22.04 LTS)" },
    { value: "noble", label: "Noble (24.04 LTS)" },
    { value: "resolute", label: "Resolute (26.04 LTS)" },
  ],
  alpinelinux: [
    { value: "3.21", label: "3.21" },
    { value: "3.22", label: "3.22" },
    { value: "3.23", label: "3.23" },
    { value: "3.24", label: "3.24 (latest stable)" },
    { value: "edge", label: "Edge (rolling)" },
  ],
  rockylinux: [
    { value: "9", label: "9" },
    { value: "10", label: "10 (latest)" },
  ],
  almalinux: [
    { value: "9", label: "9" },
    { value: "10", label: "10 (latest)" },
  ],
  fedora: [
    { value: "41", label: "41" },
    { value: "44", label: "44 (latest)" },
  ],
};

// Real per-distro package-manager names for a small, sensible set of common
// homelab/dev-jail utilities. Only groups verified to exist in that distro's
// default repos are listed — Node.js is omitted for RHEL-family/Alpine
// default repos where it isn't reliably present without extra repos enabled.
const PACKAGE_GROUPS: Record<string, PackageGroupOption[]> = {
  debian: [
    { key: "build-tools", label: "Build tools", packages: ["build-essential"] },
    { key: "git", label: "Git", packages: ["git"] },
    { key: "python3", label: "Python 3", packages: ["python3", "python3-pip", "python3-venv"] },
    { key: "nodejs", label: "Node.js", packages: ["nodejs", "npm"] },
    { key: "curl", label: "curl", packages: ["curl"] },
    { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
    { key: "sudo", label: "sudo", packages: ["sudo"] },
    { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] },
  ],
  ubuntu: [
    { key: "build-tools", label: "Build tools", packages: ["build-essential"] },
    { key: "git", label: "Git", packages: ["git"] },
    { key: "python3", label: "Python 3", packages: ["python3", "python3-pip", "python3-venv"] },
    { key: "nodejs", label: "Node.js", packages: ["nodejs", "npm"] },
    { key: "curl", label: "curl", packages: ["curl"] },
    { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
    { key: "sudo", label: "sudo", packages: ["sudo"] },
    { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] },
  ],
  alpinelinux: [
    { key: "build-tools", label: "Build tools", packages: ["build-base"] },
    { key: "git", label: "Git", packages: ["git"] },
    { key: "python3", label: "Python 3", packages: ["python3", "py3-pip"] },
    { key: "curl", label: "curl", packages: ["curl"] },
    { key: "openssh-server", label: "OpenSSH server", packages: ["openssh"] },
    { key: "sudo", label: "sudo", packages: ["sudo"] },
    { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] },
  ],
  rockylinux: [
    { key: "build-tools", label: "Build tools", packages: ["gcc", "gcc-c++", "make"] },
    { key: "git", label: "Git", packages: ["git"] },
    { key: "python3", label: "Python 3", packages: ["python3", "python3-pip"] },
    { key: "curl", label: "curl", packages: ["curl"] },
    { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
    { key: "sudo", label: "sudo", packages: ["sudo"] },
    { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] },
  ],
  almalinux: [
    { key: "build-tools", label: "Build tools", packages: ["gcc", "gcc-c++", "make"] },
    { key: "git", label: "Git", packages: ["git"] },
    { key: "python3", label: "Python 3", packages: ["python3", "python3-pip"] },
    { key: "curl", label: "curl", packages: ["curl"] },
    { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
    { key: "sudo", label: "sudo", packages: ["sudo"] },
    { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] },
  ],
  fedora: [
    { key: "build-tools", label: "Build tools", packages: ["gcc", "gcc-c++", "make"] },
    { key: "git", label: "Git", packages: ["git"] },
    { key: "python3", label: "Python 3", packages: ["python3", "python3-pip"] },
    { key: "curl", label: "curl", packages: ["curl"] },
    { key: "openssh-server", label: "OpenSSH server", packages: ["openssh-server"] },
    { key: "sudo", label: "sudo", packages: ["sudo"] },
    { key: "ca-certificates", label: "CA certificates", packages: ["ca-certificates"] },
  ],
};

const builderDistroSelect = ref<string>("debian");
const builderReleaseSelect = ref<string>("");
const builderDistroCustom = ref("");
const builderReleaseCustom = ref("");

const isCustomDistro = computed(() => builderDistroSelect.value === OTHER_DISTRO);
const isCustomRelease = computed(() => builderReleaseSelect.value === OTHER_RELEASE);

/** The exact distrobuilder-facing distro value: dropdown choice, or the custom text field. */
const builderDistro = computed(() => (isCustomDistro.value ? builderDistroCustom.value : builderDistroSelect.value));
/** The exact distrobuilder-facing release value: dropdown choice, or the custom text field. */
const builderRelease = computed(() =>
  isCustomRelease.value ? builderReleaseCustom.value : builderReleaseSelect.value
);

const releaseOptions = computed<DistroOption[]>(() => CURATED_RELEASES[builderDistroSelect.value] ?? []);

// Reset release whenever distro changes, to the first curated option for that distro.
watch(builderDistroSelect, () => {
  const options = CURATED_RELEASES[builderDistroSelect.value];
  builderReleaseSelect.value = options && options.length > 0 ? options[0].value : OTHER_RELEASE;
  builderReleaseCustom.value = "";
});
// Initialize release selection for the default distro on load.
{
  const initial = CURATED_RELEASES[builderDistroSelect.value];
  builderReleaseSelect.value = initial && initial.length > 0 ? initial[0].value : OTHER_RELEASE;
}

const builderPackagesText = ref("");
const builderAlias = ref("");
const builderSubmitting = ref(false);
const builderError = ref<string | null>(null);
const builds = ref<BuildRow[]>([]);
const basedOnAlias = ref<string | null>(null);
const showImportPanel = ref(false);

function parsePackages(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Merge searched-and-added apt packages with the free-text "additional packages"
 * field, de-duplicated. */
function resolvePackages(): string[] {
  const fromText = parsePackages(builderPackagesText.value);
  return Array.from(new Set([...Array.from(searchedAptPackages), ...fromText]));
}

// --- Package search (apt + npm + PyPI + Homebrew, unified) -----------------
// One query fans out to all four sources server-side (searchAllPackages) and returns
// a single relevance-ranked, merged list tagged per-result with its ecosystem — no
// more manually switching tabs per source. apt results feed the same OS-package list
// as the curated checkboxes; npm/PyPI results become post-install shell commands
// (npm/pip aren't OS packages — they need node/python already installed, then run as
// a `post-packages` build hook). Homebrew search works but isn't wired to "add" —
// bootstrapping brew itself inside distrobuilder's build-time chroot is
// unsupported/fragile, so faking an "Add" button that silently does nothing would be
// worse than not having it.
//
// Graceful degradation: the backend runs all four sources concurrently and reports
// per-source failures in `errors` without failing the whole search — one flaky source
// (timeout, upstream 5xx) just means fewer results from it, shown as a dismissible
// note, not a blank results list.

// 400ms is deliberately a bit above typical typeahead debounce (250-300ms) — these
// aren't cheap autocomplete lookups, a cold apt/PyPI/Homebrew cache miss behind any one
// of them means a multi-MB download, so every trigger has real cost to the upstream.
const SEARCH_DEBOUNCE_MS = 400;
const searchQuery = ref("");
const searchResults = ref<PackageSearchResult[]>([]);
const searchSourceErrors = ref<PackageSearchError[]>([]);
const searching = ref(false);
const searchError = ref<string | null>(null);
let searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
let searchRequestId = 0;

const searchedAptPackages = reactive(new Set<string>());
const postInstallCommands = reactive(new Map<string, string>()); // command text -> "npm:express" style origin key, for dedupe/removal

const ECOSYSTEM_LABELS: Record<PackageEcosystem, string> = { apt: "apt", npm: "npm", pypi: "PyPI", brew: "brew" };

/** Every trigger for a search (typing, or a distro switch invalidating the apt suite)
 * goes through this single debounce point — nothing calls runSearch() directly, so
 * there's exactly one place that can fire a request. */
function scheduleSearch() {
  if (searchDebounceHandle) clearTimeout(searchDebounceHandle);
  searchDebounceHandle = null;
  ++searchRequestId;
  const q = searchQuery.value.trim();
  if (q.length < 2) {
    searchResults.value = [];
    searchSourceErrors.value = [];
    searchError.value = null;
    return;
  }
  searchDebounceHandle = setTimeout(runSearch, SEARCH_DEBOUNCE_MS);
}

watch(searchQuery, scheduleSearch);

// A distro switch invalidates previously-added apt packages and their prereq groups,
// and changes which apt suite a re-run would search against — still goes through the
// same debounce as typing, not an immediate re-fetch.
watch(builderDistroSelect, () => {
  searchedAptPackages.clear();
  postInstallCommands.clear();
  scheduleSearch();
});

async function runSearch() {
  const q = searchQuery.value.trim();
  if (q.length < 2) return;

  const requestId = searchRequestId;
  searching.value = true;
  searchError.value = null;
  try {
    const data = await gql<{ searchAllPackages: { results: PackageSearchResult[]; errors: PackageSearchError[] } }>(
      SEARCH_ALL_PACKAGES_QUERY,
      { query: q, distro: builderDistro.value, release: builderRelease.value }
    );
    if (requestId !== searchRequestId) return; // a newer search superseded this one
    searchResults.value = data.searchAllPackages.results;
    searchSourceErrors.value = data.searchAllPackages.errors;
  } catch (e) {
    if (requestId !== searchRequestId) return;
    searchError.value = e instanceof Error ? e.message : String(e);
    searchResults.value = [];
    searchSourceErrors.value = [];
  } finally {
    if (requestId === searchRequestId) searching.value = false;
  }
}

function addAptResult(result: PackageSearchResult) {
  searchedAptPackages.add(result.name);
}

function removeAptResult(name: string) {
  searchedAptPackages.delete(name);
}

/** Best-effort: check the curated OS package group a post-install command needs, if this
 * distro curates one — e.g. npm needs Node.js installed first. If the distro doesn't
 * curate that group (a custom/"Other" distro, or a distro without it), the command is
 * still added, just without the auto-check — the user is responsible for ensuring the
 * runtime is present via "Additional packages" themselves. */
function ensurePrereqGroup(groupKey: string) {
  const group = PACKAGE_GROUPS[builderDistroSelect.value]?.find((g) => g.key === groupKey);
  if (group) {
    for (const pkg of group.packages) searchedAptPackages.add(pkg);
  }
}

function addNpmResult(result: PackageSearchResult) {
  ensurePrereqGroup("nodejs");
  postInstallCommands.set(`npm:${result.name}`, `npm install -g ${result.name}`);
}

function addPypiResult(result: PackageSearchResult) {
  ensurePrereqGroup("python3");
  postInstallCommands.set(`pypi:${result.name}`, `pip3 install ${result.name}`);
}

function removePostInstallCommand(key: string) {
  postInstallCommands.delete(key);
}

function addSearchResult(result: PackageSearchResult) {
  if (result.ecosystem === "apt") addAptResult(result);
  else if (result.ecosystem === "npm") addNpmResult(result);
  else if (result.ecosystem === "pypi") addPypiResult(result);
  // brew intentionally has no add path yet — see comment above.
}

function isSearchResultAdded(result: PackageSearchResult): boolean {
  if (result.ecosystem === "apt") return searchedAptPackages.has(result.name);
  if (result.ecosystem === "npm") return postInstallCommands.has(`npm:${result.name}`);
  if (result.ecosystem === "pypi") return postInstallCommands.has(`pypi:${result.name}`);
  return false;
}

/**
 * Populate the distro/release dropdowns (or their custom escape-hatch fields, if the
 * value isn't one of the curated options) from a preset or saved image.
 */
function setDistroAndRelease(distro: string, release: string) {
  if (CURATED_DISTROS.some((d) => d.value === distro)) {
    builderDistroSelect.value = distro;
    const releases = CURATED_RELEASES[distro] ?? [];
    if (releases.some((r) => r.value === release)) {
      builderReleaseSelect.value = release;
      builderReleaseCustom.value = "";
    } else {
      builderReleaseSelect.value = OTHER_RELEASE;
      builderReleaseCustom.value = release;
    }
  } else {
    builderDistroSelect.value = OTHER_DISTRO;
    builderDistroCustom.value = distro;
    builderReleaseSelect.value = OTHER_RELEASE;
    builderReleaseCustom.value = release;
  }
}

function clearVariantBase() {
  basedOnAlias.value = null;
}

// --- devcontainer.json import ----------------------------------------------
// Best-effort, transparent translation: devcontainer.json describes a Docker-based dev
// environment (image/Dockerfile + features + lifecycle commands + IDE/mount config) —
// only some of that maps onto "distro + release + OS packages + post-install commands"
// at all. We import what has a real mapping and report exactly what didn't, rather than
// silently dropping fields or guessing at ones we can't map confidently.

/** Recognizes common devcontainer base-image conventions (MS devcontainer images, bare
 * distro images, and language images like node:/python: which are Debian-based unless
 * tagged -alpine) and maps them to one of our 6 curated distros + a matching release. */
function inferDistroReleaseFromImage(image: string): { distro: string; release: string } | null {
  const img = image.toLowerCase();
  const codename = (candidates: string[]) => candidates.find((c) => img.includes(c));

  if (img.includes("alpine")) {
    const ver = img.match(/(\d+\.\d+)/)?.[1];
    const release = ver && CURATED_RELEASES.alpinelinux.some((r) => r.value === ver) ? ver : "3.24";
    return { distro: "alpinelinux", release };
  }
  if (img.includes("fedora")) {
    const ver = img.match(/fedora[:\-](\d+)/)?.[1];
    const release = ver && CURATED_RELEASES.fedora.some((r) => r.value === ver) ? ver : "44";
    return { distro: "fedora", release };
  }
  if (img.includes("rockylinux") || img.includes("rocky")) {
    const ver = img.match(/(\d+)/)?.[1];
    return { distro: "rockylinux", release: ver === "9" || ver === "10" ? ver : "10" };
  }
  if (img.includes("almalinux") || img.includes("alma")) {
    const ver = img.match(/(\d+)/)?.[1];
    return { distro: "almalinux", release: ver === "9" || ver === "10" ? ver : "10" };
  }
  const ubuntuCodename = codename(["jammy", "noble", "resolute", "focal", "bionic"]);
  if (img.includes("ubuntu") || ubuntuCodename) {
    const release = ubuntuCodename && CURATED_RELEASES.ubuntu.some((r) => r.value === ubuntuCodename) ? ubuntuCodename : "noble";
    return { distro: "ubuntu", release };
  }
  const debianCodename = codename(["bookworm", "trixie", "sid", "bullseye", "buster"]);
  if (img.includes("debian") || debianCodename || img.startsWith("node:") || img.startsWith("python:") || img.includes("/node") || img.includes("/python")) {
    const release = debianCodename && CURATED_RELEASES.debian.some((r) => r.value === debianCodename) ? debianCodename : "bookworm";
    return { distro: "debian", release };
  }
  return null;
}

/** Maps a devcontainer "features" ref (ghcr.io/devcontainers/features/<name>:<ver>) to
 * either a curated package-group key (installed as real OS packages) or nothing, if we
 * don't have a confident mapping for it. */
function mapFeatureToPrereqGroup(featureRef: string): string | null {
  const ref = featureRef.toLowerCase();
  if (ref.includes("/node")) return "nodejs";
  if (ref.includes("/python")) return "python3";
  return null;
}

interface DevcontainerImportResult {
  distroSet: boolean;
  packagesAdded: string[];
  commandsAdded: string[];
  skipped: string[];
}

function importDevcontainerJson(raw: string): DevcontainerImportResult {
  const doc = JSON.parse(stripJsonComments(raw));
  const result: DevcontainerImportResult = { distroSet: false, packagesAdded: [], commandsAdded: [], skipped: [] };

  clearVariantBase();
  searchedAptPackages.clear();
  postInstallCommands.clear();
  builderPackagesText.value = "";

  if (typeof doc.image === "string") {
    const inferred = inferDistroReleaseFromImage(doc.image);
    if (inferred) {
      setDistroAndRelease(inferred.distro, inferred.release);
      result.distroSet = true;
    } else {
      result.skipped.push(`image "${doc.image}" — couldn't infer a matching distro/release, pick manually`);
    }
  } else if (doc.build) {
    result.skipped.push('"build.dockerfile" — Dockerfile-based devcontainers aren\'t translated, pick a distro/release manually');
  }

  if (doc.features && typeof doc.features === "object") {
    for (const featureRef of Object.keys(doc.features)) {
      const groupKey = mapFeatureToPrereqGroup(featureRef);
      if (groupKey) {
        const group = PACKAGE_GROUPS[builderDistroSelect.value]?.find((g) => g.key === groupKey);
        if (group) {
          for (const pkg of group.packages) {
            if (!searchedAptPackages.has(pkg)) {
              searchedAptPackages.add(pkg);
              result.packagesAdded.push(pkg);
            }
          }
          continue;
        }
      }
      if (featureRef.includes("/git")) {
        if (!searchedAptPackages.has("git")) {
          searchedAptPackages.add("git");
          result.packagesAdded.push("git");
        }
        continue;
      }
      if (featureRef.includes("/common-utils")) {
        for (const pkg of ["curl", "sudo", "ca-certificates"]) {
          if (!searchedAptPackages.has(pkg)) {
            searchedAptPackages.add(pkg);
            result.packagesAdded.push(pkg);
          }
        }
        continue;
      }
      result.skipped.push(`feature "${featureRef}" — not recognized, add its packages manually if needed`);
    }
  }

  // postCreateCommand/postStartCommand typically assume the repo is already checked out
  // and mounted — that's not true during an image build, so these are added as visible,
  // editable, removable entries (not silently run) for the user to review before building.
  const lifecycleCommands: Array<[string, unknown]> = [
    ["postCreateCommand", doc.postCreateCommand],
    ["postStartCommand", doc.postStartCommand],
  ];
  for (const [field, value] of lifecycleCommands) {
    if (!value) continue;
    const commands = Array.isArray(value) ? value.map(String) : [String(value)];
    commands.forEach((cmd, i) => {
      const key = `devcontainer:${field}:${i}`;
      postInstallCommands.set(key, cmd);
      result.commandsAdded.push(cmd);
    });
  }

  if (doc.remoteUser || doc.containerUser) {
    result.skipped.push(`remoteUser/containerUser "${doc.remoteUser ?? doc.containerUser}" — not mapped, this plugin uses one fixed agent user (Config → Jail Defaults)`);
  }
  if (doc.forwardPorts || doc.mounts || doc.workspaceFolder) {
    result.skipped.push("forwardPorts/mounts/workspaceFolder — IDE/runtime concerns, not applicable to image building");
  }

  return result;
}

/** Tolerates the `//` line comments and trailing commas VS Code allows in devcontainer.json
 * (it's technically JSONC, not strict JSON) — strips them before JSON.parse. */
function stripJsonComments(text: string): string {
  return text
    .replace(/\/\/.*$/gm, "")
    .replace(/,(\s*[}\]])/g, "$1");
}

const devcontainerImportError = ref<string | null>(null);
const devcontainerImportSummary = ref<DevcontainerImportResult | null>(null);
const devcontainerFileInput = ref<HTMLInputElement | null>(null);

function triggerDevcontainerImport() {
  devcontainerFileInput.value?.click();
}

function handleDevcontainerFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  devcontainerImportError.value = null;
  devcontainerImportSummary.value = null;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      devcontainerImportSummary.value = importDevcontainerJson(String(reader.result));
    } catch (e) {
      devcontainerImportError.value = e instanceof Error ? e.message : String(e);
    }
  };
  reader.onerror = () => {
    devcontainerImportError.value = "Failed to read the file.";
  };
  reader.readAsText(file);
  (event.target as HTMLInputElement).value = ""; // allow re-importing the same file
}

// --- mise.toml / .tool-versions import + dotfiles bootstrap ----------------
// Both mise and asdf's .tool-versions describe exact tool+version pins. Neither maps
// onto OS packages (apt rarely has the exact pinned version, and doesn't cover most of
// mise's backends — cargo, npm, go, github releases, etc. — at all). The correct
// mapping is to bake `mise` itself into the image as a post-install action (its own
// installer, verified at https://mise.jdx.dev/installing-mise.html — no OS package
// needed) and let mise install the pinned tools, same as it would on a real dev
// machine. Installed system-wide (MISE_DATA_DIR=/opt/mise, not the build's root user's
// home) with a /etc/profile.d activation script, so the actual runtime agent user (a
// different, non-root uid created at container launch, not present yet at build time)
// can use the tools too — mirroring the same reasoning that ruled out baking in
// Homebrew: root's home directory during the build isn't where the real runtime user
// will look.

interface MiseToolPair {
  tool: string;
  version: string;
}

/** Reads a parsed mise.toml's [tools] table. Each entry can be a plain version string,
 * an array of versions (asdf-style fallback list — mise installs all, we just pin the
 * first since our build has no concept of "try this, then that"), or an object with a
 * `version` field (mise's extended form supporting postinstall/os/etc — those extra
 * fields aren't meaningful at image-build time so they're ignored, only `version` is
 * used). */
function parseMiseToolsTable(doc: unknown): MiseToolPair[] {
  const tools = (doc as Record<string, unknown>)?.tools;
  if (!tools || typeof tools !== "object") return [];
  const pairs: MiseToolPair[] = [];
  for (const [tool, value] of Object.entries(tools as Record<string, unknown>)) {
    if (typeof value === "string") {
      pairs.push({ tool, version: value });
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      pairs.push({ tool, version: value[0] });
    } else if (value && typeof value === "object" && typeof (value as Record<string, unknown>).version === "string") {
      pairs.push({ tool, version: (value as Record<string, unknown>).version as string });
    }
  }
  return pairs;
}

/** Parses asdf's plain-text .tool-versions format: "<tool> <version> [<fallback>...] [#
 * comment]" per line. Multiple versions on one line are asdf's fallback-chain syntax
 * (try the first, then the next, ...); we take only the first, matching mise.toml
 * import's same simplification. */
function parseToolVersionsFile(text: string): MiseToolPair[] {
  const pairs: MiseToolPair[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const [tool, version] = line.split(/\s+/);
    if (tool && version) pairs.push({ tool, version });
  }
  return pairs;
}

/** Builds the shared "install mise system-wide" command set — idempotent keys, so
 * importing a mise.toml and then adding dotfiles bootstrap (or vice versa) shares one
 * install instead of running the installer twice. */
function ensureMiseInstalled() {
  ensurePrereqGroup("build-tools"); // curl is in most distros' curated groups already, but this covers gcc-needing tools
  if (!searchedAptPackages.has("curl")) searchedAptPackages.add("curl");
  if (!searchedAptPackages.has("ca-certificates")) searchedAptPackages.add("ca-certificates");
  postInstallCommands.set("mise:env", "export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise");
  postInstallCommands.set("mise:install", "curl https://mise.run | MISE_INSTALL_PATH=/usr/local/bin/mise sh");
  postInstallCommands.set(
    "mise:profile",
    "printf 'export MISE_DATA_DIR=/opt/mise MISE_CONFIG_DIR=/etc/mise\\neval \"$(/usr/local/bin/mise activate bash)\"\\n' > /etc/profile.d/mise.sh && chmod +x /etc/profile.d/mise.sh"
  );
}

function applyMiseToolPairs(pairs: MiseToolPair[]): string[] {
  if (pairs.length === 0) return [];
  ensureMiseInstalled();
  const specs = pairs.map((p) => `${p.tool}@${p.version}`);
  postInstallCommands.set("mise:use-tools", `mise use -g ${specs.join(" ")}`);
  return specs;
}

async function importMiseToml(raw: string): Promise<{ toolsAdded: string[] }> {
  const TOML = await import("smol-toml");
  const doc = TOML.parse(raw);
  const pairs = parseMiseToolsTable(doc);
  if (pairs.length === 0) throw new Error("No [tools] entries found in this mise.toml.");
  return { toolsAdded: applyMiseToolPairs(pairs) };
}

function importToolVersions(raw: string): { toolsAdded: string[] } {
  const pairs = parseToolVersionsFile(raw);
  if (pairs.length === 0) throw new Error("No tool/version lines found in this .tool-versions file.");
  return { toolsAdded: applyMiseToolPairs(pairs) };
}

const miseImportError = ref<string | null>(null);
const miseImportSummary = ref<string[] | null>(null);
const miseTomlFileInput = ref<HTMLInputElement | null>(null);
const toolVersionsFileInput = ref<HTMLInputElement | null>(null);

function handleMiseFile(event: Event, kind: "toml" | "tool-versions") {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  miseImportError.value = null;
  miseImportSummary.value = null;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const result = kind === "toml" ? await importMiseToml(String(reader.result)) : importToolVersions(String(reader.result));
      miseImportSummary.value = result.toolsAdded;
    } catch (e) {
      miseImportError.value = e instanceof Error ? e.message : String(e);
    }
  };
  reader.onerror = () => {
    miseImportError.value = "Failed to read the file.";
  };
  reader.readAsText(file);
  (event.target as HTMLInputElement).value = "";
}

// --- Dotfiles bootstrap (mise [bootstrap.repos] / [dotfiles], experimental) ---------
// mise can declare a dotfiles repo and apply it (mise.jdx.dev/dotfiles.html,
// mise.jdx.dev/bootstrap/repos.html) — both are explicitly marked "experimental" by
// mise itself, and `mise bootstrap` only does anything useful if the CLONED repo
// itself already has a mise config with [dotfiles]/[bootstrap.repos] sections — we
// can't verify that from here (the repo isn't fetched client-side, only cloned at
// build time). So this is best-effort: clone the repo and hand off to `mise
// bootstrap --yes`, tolerating failure (`|| true`) rather than failing the whole
// image build if the repo doesn't happen to use mise's bootstrap config.

const dotfilesRepoUrl = ref("");
const dotfilesRef = ref("");

function addDotfilesBootstrap() {
  const url = dotfilesRepoUrl.value.trim();
  if (!url) return;
  ensureMiseInstalled();
  if (!searchedAptPackages.has("git")) searchedAptPackages.add("git");
  const ref = dotfilesRef.value.trim();
  const cloneCmd = ref
    ? `git clone --depth 1 --branch ${ref} ${url} /opt/dotfiles-src`
    : `git clone --depth 1 ${url} /opt/dotfiles-src`;
  postInstallCommands.set("mise:dotfiles-clone", cloneCmd);
  postInstallCommands.set(
    "mise:dotfiles-bootstrap",
    "cp /opt/dotfiles-src/mise.toml /opt/dotfiles-src/.mise.toml /etc/mise/config.d/dotfiles.toml 2>/dev/null; MISE_EXPERIMENTAL=1 mise bootstrap --yes || true"
  );
}

function removeDotfilesBootstrap() {
  postInstallCommands.delete("mise:dotfiles-clone");
  postInstallCommands.delete("mise:dotfiles-bootstrap");
  dotfilesRepoUrl.value = "";
  dotfilesRef.value = "";
}

// --- Builder presets --------------------------------------------------

const presets = ref<BuilderPreset[]>([]);
const newPresetName = ref("");
const presetSaving = ref(false);
const presetError = ref<string | null>(null);

async function loadBuilderPresets() {
  const data = await gql<{ builderPresets: BuilderPreset[] }>(BUILDER_PRESETS_QUERY);
  if (!componentActive) return;
  presets.value = data.builderPresets;
}

async function savePreset() {
  const name = newPresetName.value.trim();
  if (!name) return;
  presetError.value = null;
  presetSaving.value = true;
  try {
    await gql(SAVE_BUILDER_PRESET_MUTATION, {
      input: {
        name,
        distro: builderDistro.value.trim(),
        release: builderRelease.value.trim(),
        packages: resolvePackages(),
      },
    });
    newPresetName.value = "";
    await loadBuilderPresets();
  } catch (e) {
    presetError.value = e instanceof Error ? e.message : String(e);
  } finally {
    presetSaving.value = false;
  }
}

function loadPreset(preset: BuilderPreset) {
  setDistroAndRelease(preset.distro, preset.release);
  builderPackagesText.value = preset.packages.join("\n");
  builderAlias.value = "";
  clearVariantBase();
}

async function deletePreset(name: string) {
  presetError.value = null;
  try {
    await gql(DELETE_BUILDER_PRESET_MUTATION, { name });
    await loadBuilderPresets();
  } catch (e) {
    presetError.value = e instanceof Error ? e.message : String(e);
  }
}

// --- Saved images (master + variants) ----------------------------------

const jailImages = ref<ImageRecord[]>([]);
const imagesError = ref<string | null>(null);
const masterToggling = ref<string | null>(null);

async function loadJailImages() {
  const data = await gql<{ jailImages: ImageRecord[] }>(JAIL_IMAGES_QUERY);
  if (!componentActive) return;
  jailImages.value = data.jailImages;
}

/**
 * There's exactly one golden master at a time (the backend enforces this — setting one
 * clears the flag on every other tracked image). Marking an image master also makes it
 * the actual default new containers launch from (config.jailImage), so "master" means
 * something real, not just a label.
 */
async function toggleMaster(image: ImageRecord) {
  // A default can only be replaced, never cleared into a contradictory state
  // where the registry has no master but config still launches its old alias.
  if (image.isMaster) return;
  imagesError.value = null;
  masterToggling.value = image.alias;
  const previousMaster = jailImages.value.find((candidate) => candidate.isMaster)?.alias ?? null;
  try {
    await gql(SET_MASTER_IMAGE_MUTATION, { alias: image.alias, isMaster: true });
    await gql(UPDATE_CONFIG_MUTATION, { input: { jailImage: image.alias } });
    await Promise.all([loadJailImages(), loadConfig()]);
  } catch (e) {
    // The registry and launch default are separate persistence stores. Revert
    // the first mutation if the second fails, then reload canonical state so
    // the UI can never advertise a master that new containers do not use.
    await Promise.allSettled([
      previousMaster
        ? gql(SET_MASTER_IMAGE_MUTATION, { alias: previousMaster, isMaster: true })
        : gql(SET_MASTER_IMAGE_MUTATION, { alias: image.alias, isMaster: false }),
    ]);
    await Promise.allSettled([loadJailImages(), loadConfig()]);
    imagesError.value = e instanceof Error ? e.message : String(e);
  } finally {
    masterToggling.value = null;
  }
}

function buildVariantFrom(image: ImageRecord) {
  setDistroAndRelease(image.distro, image.release);
  builderPackagesText.value = image.packages.join("\n");
  builderAlias.value = "";
  basedOnAlias.value = image.alias;
}

const imageDeleting = ref<string | null>(null);

async function deleteJailImage(image: ImageRecord) {
  if (!confirm(`Delete image "${image.alias}"? This removes it from Incus and cannot be undone.`)) return;
  imagesError.value = null;
  imageDeleting.value = image.alias;
  try {
    await gql(DELETE_JAIL_IMAGE_MUTATION, { alias: image.alias });
    jailImages.value = jailImages.value.filter((i) => i.alias !== image.alias);
    if (basedOnAlias.value === image.alias) clearVariantBase();
  } catch (e) {
    imagesError.value = e instanceof Error ? e.message : String(e);
  } finally {
    imageDeleting.value = null;
  }
}

function packageSummary(packages: string[]): string {
  if (packages.length === 0) return "no packages";
  return packages.join(", ");
}

const pruningImages = ref(false);
const pruneResult = ref("");

/** Untrack any saved image record whose Incus image was deleted out-of-band (e.g. via the incus CLI). */
async function pruneStaleImageRecords() {
  pruningImages.value = true;
  imagesError.value = null;
  pruneResult.value = "";
  try {
    const data = await gql<{ pruneStaleImageRecords: string[] }>(PRUNE_STALE_IMAGE_RECORDS_MUTATION);
    if (data.pruneStaleImageRecords.length === 0) {
      pruneResult.value = "Nothing to prune — every saved image still exists in Incus.";
    } else {
      pruneResult.value = `Untracked ${data.pruneStaleImageRecords.length}: ${data.pruneStaleImageRecords.join(", ")}`;
      jailImages.value = jailImages.value.filter((i) => !data.pruneStaleImageRecords.includes(i.alias));
    }
  } catch (e) {
    imagesError.value = e instanceof Error ? e.message : String(e);
  } finally {
    pruningImages.value = false;
  }
}

function stopPolling(build: BuildRow) {
  if (build.intervalId !== null) {
    build.intervalId.stop();
    build.intervalId = null;
  }
}

function pollBuildStatus(build: BuildRow) {
  build.intervalId = startPolling(async (pollContext) => {
    try {
      const data = await gql<{ jailImageBuildStatus: ImageBuildStatus | null }>(BUILD_STATUS_QUERY, {
        buildId: build.buildId,
      });
      if (!pollContext.isActive()) return;
      build.status = data.jailImageBuildStatus;
      if (build.status?.status === "success") {
        stopPolling(build);
        try {
          await loadJailImages();
        } catch (e) {
          imagesError.value = e instanceof Error ? e.message : String(e);
        }
      } else if (build.status?.status === "failed") {
        stopPolling(build);
      }
    } catch (e) {
      if (!pollContext.isActive()) return;
      build.error = e instanceof Error ? e.message : String(e);
      stopPolling(build);
    }
  }, JOB_POLL_INTERVAL_MS);
}

async function startBuild() {
  builderError.value = null;
  const distro = builderDistro.value.trim();
  const release = builderRelease.value.trim();
  const alias = builderAlias.value.trim();
  const packages = resolvePackages();

  if (!distro || !release || !alias) {
    builderError.value = "Distro, release, and alias are required.";
    return;
  }

  builderSubmitting.value = true;
  try {
    const data = await gql<{ buildJailImage: string }>(BUILD_JAIL_IMAGE_MUTATION, {
      distro,
      release,
      packages,
      alias,
      basedOn: basedOnAlias.value || null,
      postInstallCommands: Array.from(postInstallCommands.values()),
    });
    const build: BuildRow = {
      buildId: data.buildJailImage,
      distro,
      release,
      alias,
      status: null,
      error: null,
      intervalId: null,
    };
    builds.value.unshift(build);
    // Poll the reactive array element, not the raw `build` object above — mutating a plain
    // object after it's been pushed into a reactive array doesn't trigger Vue's reactivity
    // (only mutations through the array's own reactive-wrapped reference do). Verified live:
    // a build that failed instantly correctly polled and got "failed" back, then stopped
    // polling as designed — but the UI stayed stuck on "queued" forever because this exact
    // mistake meant the fetched status update was invisible to the template.
    pollBuildStatus(builds.value[0]);

    // Reset the form for the next build, keep distro since it's usually reused.
    const releases = CURATED_RELEASES[builderDistroSelect.value];
    builderReleaseSelect.value = releases && releases.length > 0 ? releases[0].value : OTHER_RELEASE;
    builderReleaseCustom.value = "";
    builderAlias.value = "";
    builderPackagesText.value = "";
    searchedAptPackages.clear();
    postInstallCommands.clear();
    searchResults.value = [];
    searchQuery.value = "";
    miseImportSummary.value = null;
    miseImportError.value = null;
    dotfilesRepoUrl.value = "";
    dotfilesRef.value = "";
    clearVariantBase();
  } catch (e) {
    builderError.value = e instanceof Error ? e.message : String(e);
  } finally {
    builderSubmitting.value = false;
  }
}

function buildStatusBadgeVariant(status: string | undefined): "green" | "gray" | "orange" | "red" {
  switch (status) {
    case "success":
      return "green";
    case "failed":
      return "red";
    case "running":
      return "orange";
    default:
      return "gray";
  }
}

onBeforeUnmount(() => {
  componentActive = false;
  ++statusRequestId;
  ++searchRequestId;
  for (const build of builds.value) stopPolling(build);
  stopStatusPolling();
  stopInstallPolling();
  stopPrivilegedPolling();
  if (searchDebounceHandle) clearTimeout(searchDebounceHandle);
});
</script>

<template>
  <div class="unapi w-full max-w-4xl text-foreground xl:max-w-6xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1880px] min-[2560px]:max-w-[2200px]">
    <div v-if="loading" class="py-8 text-muted-foreground">Loading incus configuration…</div>

    <template v-else>
      <div v-if="error" role="alert" class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ error }}
      </div>

      <!-- Masthead -->
      <header class="mb-6 flex items-center gap-3 border-b border-border pb-4">
        <svg width="14" height="20" viewBox="0 0 10 14" fill="none" aria-hidden="true" class="shrink-0 text-foreground">
          <path d="M5 0L9 2.5L5 5L1 2.5Z" fill="currentColor" opacity="0.95" />
          <path d="M5 3L9 5.5L5 8L1 5.5Z" fill="currentColor" opacity="0.7" />
          <path d="M5 6L9 8.5L5 11L1 8.5Z" fill="currentColor" opacity="0.45" />
          <path d="M5 9L9 11.5L5 14L1 11.5Z" fill="currentColor" opacity="0.25" />
        </svg>
        <span class="text-sm font-semibold tracking-[0.14em] uppercase">Incus</span>
        <span class="text-xs text-muted-foreground">dev containers</span>
        <div class="ml-auto flex items-center gap-3">
          <Badge :variant="incusHealthy ? 'green' : 'red'">{{ incusHealthy ? "Reachable" : "Not running" }}</Badge>
          <Button size="sm" variant="outline" @click="refreshStatus">Refresh</Button>
        </div>
      </header>

      <!-- Tab switcher -->
      <TabNavigation v-model="activeTab" />

      <!-- Builder tab -->
      <section v-if="activeTab === 'builder'" id="incus-panel-builder" role="tabpanel" aria-labelledby="incus-tab-builder" tabindex="0">
        <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div>
        <!-- Inputs: presets + saved images + config imports feed the form below -->
        <p class="mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Starting points</p>

        <div class="mb-6 rounded-lg border border-border bg-card p-4 xl:mb-0">
          <!-- Presets -->
          <h3 class="mb-2 text-sm font-semibold">Presets</h3>
          <p v-if="presetError" class="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {{ presetError }}
          </p>
          <p v-if="presets.length === 0" class="text-sm text-muted-foreground">Save the form below as a preset to reuse it later.</p>
          <div v-else class="mb-3 flex flex-wrap gap-2">
            <div
              v-for="preset in presets"
              :key="preset.name"
              class="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
            >
              <button type="button" class="cursor-pointer font-medium hover:text-primary" @click="loadPreset(preset)">
                {{ preset.name }}
              </button>
              <span class="font-mono text-muted-foreground">{{ preset.distro }}/{{ preset.release }}</span>
              <button
                type="button"
                class="cursor-pointer text-muted-foreground hover:text-destructive"
                aria-label="Delete preset"
                @click="deletePreset(preset.name)"
              >✕</button>
            </div>
          </div>
          <div class="flex gap-2">
            <Label for="new-preset-name" class="sr-only">Preset name</Label>
            <Input id="new-preset-name" v-model="newPresetName" placeholder="Preset name" class="w-56" />
            <Button size="sm" variant="outline" :disabled="presetSaving || !newPresetName.trim()" @click="savePreset">
              {{ presetSaving ? "Saving…" : "Save as preset" }}
            </Button>
          </div>
          <HelpText>
            Saves distro, release, and the current package/tool list — not the alias, since that should stay
            unique per build. Saving under a name that already exists overwrites it.
          </HelpText>

          <!-- Saved images -->
          <div class="mt-5 border-t border-border pt-4">
            <div class="mb-2 flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold">Saved images</h3>
              <Button
                v-if="jailImages.length > 0"
                size="sm"
                variant="outline"
                :disabled="pruningImages"
                @click="pruneStaleImageRecords"
              >{{ pruningImages ? "Checking…" : "Prune stale records" }}</Button>
            </div>
            <p v-if="imagesError" class="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {{ imagesError }}
            </p>
            <p v-if="pruneResult" class="mb-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs">
              {{ pruneResult }}
            </p>
            <p v-if="jailImages.length === 0" class="text-sm text-muted-foreground">
              No images built yet — the first one you build can become the golden master.
            </p>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="image in [...jailImages].sort((a, b) => (b.isMaster ? 1 : 0) - (a.isMaster ? 1 : 0))"
                :key="image.alias"
                class="flex items-center gap-3 rounded-md border px-3 py-2"
                :class="image.isMaster ? 'border-primary bg-primary/5' : 'border-border'"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[13px] font-medium">{{ image.alias }}</span>
                    <Badge v-if="image.isMaster" variant="orange">Golden master</Badge>
                    <span class="text-xs text-muted-foreground">{{ image.distro }}/{{ image.release }}</span>
                  </div>
                  <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ packageSummary(image.packages) }}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="image.isMaster || masterToggling === image.alias"
                  @click="toggleMaster(image)"
                  :title="image.isMaster ? 'Current launch default; choose another image to replace it' : 'New containers launch from this image by default'"
                >{{ image.isMaster ? "Default" : "Set as default" }}</Button>
                <Button size="sm" variant="secondary" @click="buildVariantFrom(image)">Build variant</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  :disabled="imageDeleting === image.alias"
                  @click="deleteJailImage(image)"
                >Delete</Button>
              </div>
            </div>
            <HelpText>
              Only one image can be the golden master at a time — marking a new one unmarks the previous.
              Marking it also sets it as the default image new containers launch from (Config → Container
              Defaults), so this is more than a label. "Build variant" pre-fills the form from that image's
              distro/release/packages so you can edit, extend, or strip it down before building a new one.
              "Prune stale records" checks every saved image still actually exists in Incus and untracks any
              that don't — useful if one was deleted directly via the incus CLI instead of through here.
            </HelpText>
          </div>

          <!-- Import from a config file (collapsed by default) -->
          <div class="mt-5 border-t border-border pt-4">
            <button
              type="button"
              :aria-expanded="showImportPanel"
              aria-controls="config-import-panel"
              class="flex w-full cursor-pointer items-center gap-1.5 text-left text-sm font-semibold"
              @click="showImportPanel = !showImportPanel"
            >
              <span class="text-muted-foreground transition-transform" :class="showImportPanel ? 'rotate-90' : ''">▸</span>
              Import from a config file
              <span class="font-normal text-xs text-muted-foreground">devcontainer.json, mise.toml, .tool-versions</span>
            </button>

            <div v-if="showImportPanel" id="config-import-panel" class="mt-3 flex flex-col gap-4">
              <div>
                <p class="mb-2 text-xs text-muted-foreground">
                  devcontainer.json — maps the base image and recognized features to real packages; anything that
                  isn't applicable to image building is reported, not silently dropped.
                </p>
                <input ref="devcontainerFileInput" type="file" accept=".json,application/json" class="hidden" @change="handleDevcontainerFile" />
                <Button size="sm" variant="outline" @click="triggerDevcontainerImport">Choose devcontainer.json…</Button>
                <p v-if="devcontainerImportError" class="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {{ devcontainerImportError }}
                </p>
                <div v-if="devcontainerImportSummary" class="mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs">
                  <p v-if="devcontainerImportSummary.distroSet" class="text-foreground">Distro/release set from <span class="font-mono">image</span>.</p>
                  <p v-if="devcontainerImportSummary.packagesAdded.length > 0" class="mt-1">
                    Packages added: <span class="font-mono">{{ devcontainerImportSummary.packagesAdded.join(", ") }}</span>
                  </p>
                  <p v-if="devcontainerImportSummary.commandsAdded.length > 0" class="mt-1">
                    {{ devcontainerImportSummary.commandsAdded.length }} lifecycle command(s) added below — review before building.
                  </p>
                  <div v-if="devcontainerImportSummary.skipped.length > 0" class="mt-1">
                    <p class="text-muted-foreground">Skipped (review manually):</p>
                    <ul class="ml-4 list-disc text-muted-foreground">
                      <li v-for="s in devcontainerImportSummary.skipped" :key="s">{{ s }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="border-t border-border pt-4">
                <p class="mb-2 text-xs text-muted-foreground">
                  mise.toml / .tool-versions — pins exact tool versions by baking in <span class="font-mono">mise</span> itself
                  as a post-install step, wired system-wide so the container's actual runtime user can use the tools too.
                </p>
                <input ref="miseTomlFileInput" type="file" accept=".toml,application/toml" class="hidden" @change="handleMiseFile($event, 'toml')" />
                <input ref="toolVersionsFileInput" type="file" accept=".tool-versions,text/plain" class="hidden" @change="handleMiseFile($event, 'tool-versions')" />
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" @click="miseTomlFileInput?.click()">Choose mise.toml…</Button>
                  <Button size="sm" variant="outline" @click="toolVersionsFileInput?.click()">Choose .tool-versions…</Button>
                </div>
                <p v-if="miseImportError" class="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {{ miseImportError }}
                </p>
                <p v-if="miseImportSummary" class="mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs">
                  Tools pinned: <span class="font-mono">{{ miseImportSummary.join(", ") }}</span> — see the setup commands below.
                </p>
              </div>

              <div class="border-t border-border pt-4">
                <Label for="dotfiles-repo" class="mb-1 block">Bootstrap dotfiles from a repo</Label>
                <p class="mb-2 text-xs text-muted-foreground">
                  Experimental — clones the repo and hands off to <span class="font-mono">mise bootstrap</span>, which only
                  applies dotfiles if that repo's own mise config declares them.
                </p>
                <div class="flex flex-wrap gap-2">
                  <Input id="dotfiles-repo" v-model="dotfilesRepoUrl" class="w-72 font-mono" placeholder="git@github.com:you/dotfiles.git" />
                  <Input v-model="dotfilesRef" aria-label="Dotfiles branch or tag (optional)" class="w-32 font-mono" placeholder="branch (optional)" />
                  <Button size="sm" variant="outline" :disabled="!dotfilesRepoUrl.trim()" @click="addDotfilesBootstrap">Add bootstrap</Button>
                  <Button
                    v-if="postInstallCommands.has('mise:dotfiles-clone')"
                    size="sm"
                    variant="outline"
                    @click="removeDotfilesBootstrap"
                  >Remove</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div>
        <!-- Form: builds a new image, optionally from the starting points above -->
        <p class="mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Build</p>
        <div class="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 class="mb-4 text-base font-semibold">Build container image</h3>
          <div v-if="builderError" class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {{ builderError }}
          </div>
          <div
            v-if="basedOnAlias"
            class="mb-4 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs"
          >
            <span>Building variant of: <span class="font-mono font-medium">{{ basedOnAlias }}</span></span>
            <button type="button" class="ml-auto cursor-pointer text-muted-foreground hover:text-foreground" @click="clearVariantBase">
              ✕ Clear
            </button>
          </div>
          <div class="grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4">
            <Label for="builder-distro">Distro</Label>
            <div class="flex justify-self-end gap-2">
              <Select id="builder-distro" v-model="builderDistroSelect" class="w-48">
                <option v-for="d in CURATED_DISTROS" :key="d.value" :value="d.value">{{ d.label }}</option>
                <option :value="OTHER_DISTRO">Other… (custom)</option>
              </Select>
              <Input
                v-if="isCustomDistro"
                id="builder-custom-distro"
                aria-label="Custom distro"
                v-model="builderDistroCustom"
                class="w-40 font-mono"
                placeholder="e.g. archlinux"
              />
            </div>
            <HelpText class="col-span-2">
              The curated list is verified against distrobuilder's own real image definitions — pick "Other" for
              anything else it supports; distrobuilder covers more than this list captures.
            </HelpText>

            <Label for="builder-release">Release</Label>
            <div class="flex justify-self-end gap-2">
              <Select id="builder-release" v-model="builderReleaseSelect" class="w-48">
                <option v-for="r in releaseOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
                <option :value="OTHER_RELEASE">Other… (custom)</option>
              </Select>
              <Input
                v-if="isCustomRelease"
                id="builder-custom-release"
                aria-label="Custom release"
                v-model="builderReleaseCustom"
                class="w-40 font-mono"
                placeholder="e.g. rolling"
              />
            </div>
            <HelpText class="col-span-2">Options change with the distro above — a custom distro always shows the free-text field here too.</HelpText>

            <Label for="builder-alias">Alias</Label>
            <Input id="builder-alias" v-model="builderAlias" class="w-96 justify-self-end" placeholder="my-custom-image" />
            <HelpText class="col-span-2">
              Becomes the image's name in Incus once the build succeeds — other containers (and "build variant")
              reference it by this alias, so it must be unique. Not required to match the container's own name.
            </HelpText>
          </div>

          <div class="mt-5 border-t border-border pt-4">
            <p class="mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Packages &amp; tools</p>
            <Label for="package-search" class="sr-only">Search packages and tools</Label>
            <Input id="package-search" v-model="searchQuery" class="w-full font-mono" placeholder="Search apt, npm, PyPI, Homebrew…" />
            <HelpText>
              apt only searches when Debian or Ubuntu is selected above. npm and PyPI results aren't OS packages
              — adding one adds a setup command that runs after packages install, and auto-adds the Node.js or
              Python packages it needs. Homebrew results show for browsing but can't be added yet — there's no
              way to bootstrap Homebrew itself inside an image build.
            </HelpText>

            <p v-if="searchError" class="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {{ searchError }}
            </p>
            <p v-if="searchSourceErrors.length > 0" class="mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Some sources are unavailable right now, showing results from the rest:
              <span v-for="(e, i) in searchSourceErrors" :key="e.ecosystem">{{ i > 0 ? ", " : " " }}<strong>{{ ECOSYSTEM_LABELS[e.ecosystem] }}</strong></span>
            </p>
            <p v-if="searching" class="mt-2 text-xs text-muted-foreground">Searching…</p>
            <div v-else-if="searchResults.length > 0" class="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto">
              <div
                v-for="result in searchResults"
                :key="`${result.ecosystem}:${result.name}`"
                class="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
              >
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase"
                  :class="result.ecosystem === 'apt' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
                >{{ ECOSYSTEM_LABELS[result.ecosystem] }}</span>
                <div class="min-w-0 flex-1">
                  <span class="font-mono font-medium">{{ result.name }}</span>
                  <span v-if="result.version" class="ml-1.5 font-mono text-muted-foreground">{{ result.version }}</span>
                  <p v-if="result.description" class="truncate text-muted-foreground">{{ result.description }}</p>
                </div>
                <Button
                  v-if="result.ecosystem !== 'brew'"
                  size="sm"
                  variant="outline"
                  :disabled="isSearchResultAdded(result)"
                  @click="addSearchResult(result)"
                >{{ isSearchResultAdded(result) ? "Added" : "+ Add" }}</Button>
                <span v-else class="shrink-0 text-muted-foreground">not build-time yet</span>
              </div>
            </div>
            <p v-else-if="searchQuery.trim().length >= 2" class="mt-2 text-xs text-muted-foreground">No matches.</p>

            <div v-if="searchedAptPackages.size > 0" class="mt-3">
              <p class="mb-1.5 block text-xs font-medium">Added from apt search</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="name in searchedAptPackages"
                  :key="name"
                  class="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
                >
                  {{ name }}
                  <button type="button" :aria-label="`Remove apt package ${name}`" class="cursor-pointer text-muted-foreground hover:text-destructive" @click="removeAptResult(name)">✕</button>
                </span>
              </div>
            </div>

            <div v-if="postInstallCommands.size > 0" class="mt-3">
              <p class="mb-1.5 block text-xs font-medium">Extra setup commands (run after packages install)</p>
              <div class="flex flex-col gap-1">
                <div
                  v-for="[key, cmd] in postInstallCommands"
                  :key="key"
                  class="flex items-center gap-2 rounded-md border border-border px-2 py-1 font-mono text-xs"
                >
                  <span class="flex-1">{{ cmd }}</span>
                  <button type="button" :aria-label="`Remove setup command ${key}`" class="cursor-pointer text-muted-foreground hover:text-destructive" @click="removePostInstallCommand(key)">✕</button>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <Label for="builder-extra-packages" class="mb-1.5 block text-xs text-muted-foreground">Anything else? (one per line, or comma-separated)</Label>
            <textarea
              id="builder-extra-packages"
              v-model="builderPackagesText"
              rows="2"
              class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm font-mono"
              placeholder="e.g. htop"
            ></textarea>
            <HelpText>
              Exact OS package names for the selected distro's package manager — merged with anything added from
              search above, duplicates removed. Use this for anything search didn't turn up.
            </HelpText>
          </div>

          <div class="mt-4 flex justify-end">
            <Button :disabled="builderSubmitting" @click="startBuild">
              {{ builderSubmitting ? "Starting…" : "Build" }}
            </Button>
          </div>
        </div>
        </div>
        </div>

        <!-- Output: build results -->
        <p class="mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Results</p>
        <div class="rounded-lg border border-border bg-card p-4">
          <h3 class="mb-4 text-base font-semibold">Builds</h3>
          <HelpText>
            Live distrobuilder log output, streamed while a build runs. This list is client-side only and
            resets on page reload — successful builds still land in Saved images above, but the log history
            itself isn't persisted.
          </HelpText>
          <div
            v-if="builds.length === 0"
            class="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5"
          >
            <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" />
            <span class="font-mono text-[11px] text-neutral-500">
              Pick a distro and release above, then hit Build — progress and logs stream in here.<span
                class="motion-safe:animate-pulse"
              >_</span>
            </span>
          </div>
          <div v-else class="flex flex-col gap-4">
            <div v-for="build in builds" :key="build.buildId" class="rounded-md border border-border p-3">
              <div class="mb-2 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ build.alias }}</span>
                  <span class="text-xs text-muted-foreground">{{ build.distro }} / {{ build.release }}</span>
                </div>
                <Badge :variant="buildStatusBadgeVariant(build.status?.status)">
                  {{ build.status?.status ?? "queued" }}
                </Badge>
              </div>
              <div v-if="build.status?.error || build.error" class="mb-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {{ build.status?.error || build.error }}
              </div>
              <div class="flex items-center gap-2 rounded-t-md border border-b-0 border-neutral-800 bg-neutral-950 px-3 py-1.5">
                <span
                  class="h-1.5 w-1.5 shrink-0 rounded-full"
                  :class="{
                    'bg-emerald-500': build.status?.status === 'success',
                    'bg-red-500': build.status?.status === 'failed',
                    'bg-amber-500': build.status?.status === 'running' || !build.status,
                  }"
                />
                <span class="font-mono text-[11px] text-neutral-400">distrobuilder · {{ build.buildId.slice(0, 8) }}</span>
              </div>
              <pre
                class="max-h-48 overflow-auto rounded-b-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs font-mono whitespace-pre-wrap text-neutral-200"
              >{{ build.status?.logTail || "Waiting for log output…" }}</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Jails tab -->
      <section v-else-if="activeTab === 'jails'" id="incus-panel-jails" role="tabpanel" aria-labelledby="incus-tab-jails" tabindex="0">
        <!-- Dashboard: live summary cards -->
        <p class="mb-2 text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">Dashboard</p>
        <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div class="rounded-lg border border-border bg-card p-3">
            <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Total Containers</p>
            <p class="mt-1 font-mono text-xl">{{ jails.length }}</p>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Running</p>
            <p class="mt-1 font-mono text-xl">{{ runningJails.length }}</p>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Stopped</p>
            <p class="mt-1 font-mono text-xl">{{ stoppedJailsCount }}</p>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Daemon</p>
            <div class="mt-1.5">
              <Badge :variant="incusHealthy ? 'green' : 'red'">{{ incusHealthy ? "Reachable" : "Not running" }}</Badge>
            </div>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Memory In Use</p>
            <p class="mt-1 font-mono text-xl">{{ formatBytes(totalMemoryUsageBytes) }}</p>
          </div>
          <div class="rounded-lg border border-border bg-card p-3">
            <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Total CPU (live)</p>
            <p class="mt-1 font-mono text-xl">{{ totalCpuRateLabel() }}</p>
            <svg
              v-if="fleetHistory.length >= 2"
              viewBox="0 0 80 24"
              width="80"
              height="24"
              class="mt-1 text-primary"
              preserveAspectRatio="none"
            >
              <polyline
                :points="sparklinePoints(fleetHistory, 'cpuPct')"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            <p class="mt-0.5 text-[10px] text-muted-foreground">last ~2 min, sum of running containers</p>
          </div>
        </div>
        <HelpText class="mb-6">
          CPU shown here is a live rate (% of one core), computed from the change in cumulative CPU time between
          polls every 5 seconds — not the raw counter Incus reports, which only ever goes up. The sparkline is a
          rolling client-side window that resets on page reload; nothing is persisted server-side.
        </HelpText>

        <!-- Network & ACL status — real, already-loaded config, not a per-jail live check -->
        <div class="mb-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <div class="rounded-lg border border-border bg-card p-4">
          <h3 class="mb-1 text-base font-semibold">Network &amp; ACL</h3>
          <p class="mb-3 text-xs text-muted-foreground">
            The policy currently configured for every container on this bridge (from saved config, not a live probe).
          </p>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            <div>
              <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Bridge</p>
              <p class="mt-1 font-mono text-sm">{{ config.jailBridge || "—" }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Subnet</p>
              <p class="mt-1 font-mono text-sm">{{ config.jailSubnet || "—" }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">ACL Name</p>
              <p class="mt-1 font-mono text-sm">{{ config.aclName || "—" }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Blocked Ranges</p>
              <p class="mt-1 font-mono text-sm">{{ blockedCidrCount() }} blocked</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Default Egress / Ingress</p>
              <p class="mt-1 font-mono text-sm">{{ config.aclDefaultEgress }} / {{ config.aclDefaultIngress }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-border bg-card p-4">
          <h3 class="mb-1 text-base font-semibold">Launch Container</h3>
          <p class="mb-3 text-xs text-muted-foreground">
            Applies the Container Defaults profile — no build step. Each container gets its own independent
            root filesystem and workspace even when launched from the same image.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div class="flex-1">
              <Label for="new-container-name" class="mb-2 block">Container name</Label>
              <Input id="new-container-name" v-model="newJailName" placeholder="new-container-name" class="w-full font-mono" />
            </div>
            <div class="flex-1">
              <Label for="launch-image" class="mb-2 block">Image</Label>
              <Select id="launch-image" v-model="launchImageSelect" class="w-full">
                <option value="">Default ({{ config.jailImage || "—" }})</option>
                <option v-for="image in jailImages" :key="image.alias" :value="image.alias">
                  {{ image.alias }}{{ image.isMaster ? " (golden master)" : "" }} — {{ image.distro }}/{{ image.release }}
                </option>
              </Select>
            </div>
            <Button size="sm" variant="secondary" :disabled="!!newJailNameError" @click="launchJail">Launch</Button>
          </div>
          <p v-if="newJailName && newJailNameError" class="mt-2 text-xs text-destructive">{{ newJailNameError }}</p>
          <div class="mt-3 flex items-center gap-2.5">
            <Switch id="launch-allow-sudo" v-model="launchAllowSudo" />
            <label for="launch-allow-sudo" class="cursor-pointer text-xs">
              Allow sudo (NOPASSWD) for the agent user
            </label>
          </div>
          <HelpText>
            "Default" launches from Config → Container Defaults' image (the golden master, if one is set).
            Picking a specific image here launches from that image instead, just for this container — it
            doesn't change the default. Every launch, from any image, gets its own independent root filesystem;
            nothing is shared between containers built from the same source image. Sudo is off by default on
            purpose — the agent user having no path to root is what keeps a compromised dependency from
            escalating inside the container. Turning it on trades that away for convenience; you can also grant
            or check it later, per-container, from its Details panel.
          </HelpText>
        </div>
        </div>

        <div class="rounded-lg border border-border bg-card p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-base font-semibold">Containers</h3>
            <Button
              v-if="stoppedJailsCount > 0"
              size="sm"
              variant="outline"
              :disabled="deletingStopped"
              @click="deleteStoppedJails"
            >{{ deletingStopped ? "Deleting…" : `Delete ${stoppedJailsCount} stopped` }}</Button>
          </div>
          <HelpText>
            "On bridge" means this container's address falls inside the configured subnet — a real check, not a
            claim that the LAN-ban ACL is actively enforced for it specifically (that's a daemon-level policy on
            the whole bridge, shown above under Network &amp; ACL). Each row's mini charts are the same rolling
            client-side window as the summary cards above.
          </HelpText>

          <p v-if="jails.length === 0" class="text-sm text-muted-foreground">
            No containers yet — launch one above to get started.
          </p>
          <template v-else>
          <p class="mb-3 text-xs text-muted-foreground">
            Total: {{ runningJails.length }} container{{ runningJails.length === 1 ? "" : "s" }} running,
            {{ formatBytes(totalMemoryUsageBytes) }} memory, CPU time {{ formatDuration(Number(totalCpuUsageNs)) }}
          </p>
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div
              v-for="jail in jails"
              :key="jail.name"
              class="rounded-lg border border-border p-3"
              :class="detailsJailName === jail.name ? 'border-primary/50' : 'border-border'"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="truncate font-mono text-[13px] font-medium">{{ jail.name }}</span>
                  <span
                    v-if="jailOnBridgeSubnet(jail)"
                    class="shrink-0 inline-flex items-center rounded-full bg-unraid-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-unraid-green-800"
                    title="This container's IPv4 falls within the configured subnet."
                  >on bridge</span>
                  <Badge :variant="statusBadgeVariant(jail.status)">{{ jail.status }}</Badge>
                </div>
                <span class="shrink-0 font-mono text-xs text-muted-foreground">{{ jail.ipv4 || "—" }}</span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground" :title="`Live rate, % ${cpuRateSuffix()}`">CPU</p>
                  <div class="mt-1 flex items-center gap-2">
                    <div class="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        v-if="cpuRatePct(jail) !== null"
                        class="h-full rounded-full bg-primary"
                        :style="{ width: cpuRatePct(jail) + '%' }"
                      />
                    </div>
                    <span class="font-mono text-[13px]">{{ cpuRateLabel(jail) }}</span>
                    <svg
                      v-if="jailCpuHistory(jail.name).length >= 2"
                      viewBox="0 0 80 24"
                      width="60"
                      height="18"
                      class="text-primary"
                      preserveAspectRatio="none"
                    >
                      <polyline :points="sparklinePoints(jailCpuHistory(jail.name), 'cpuPct')" fill="none" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">Memory</p>
                  <div class="mt-1 flex items-center gap-2">
                    <span class="font-mono text-[13px]">{{ formatMemory(jail) }}</span>
                    <svg
                      v-if="jailCpuHistory(jail.name).length >= 2"
                      viewBox="0 0 80 24"
                      width="60"
                      height="18"
                      class="text-primary"
                      preserveAspectRatio="none"
                    >
                      <polyline :points="sparklinePoints(jailCpuHistory(jail.name), 'memPct')" fill="none" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                  </div>
                  <div v-if="memoryFillPct(jail) !== null" class="mt-1 h-1 w-20 overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full bg-primary" :style="{ width: memoryFillPct(jail) + '%' }" />
                  </div>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" @click="jailAction(jail.name, 'start')">Start</Button>
                <Button size="sm" variant="outline" @click="jailAction(jail.name, 'stop')">Stop</Button>
                <Button
                  size="sm"
                  variant="secondary"
                  :disabled="jail.status.toLowerCase() !== 'running'"
                  @click="consoleJail = jail.name"
                >Console</Button>
                <Button
                  size="sm"
                  variant="outline"
                  @click="toggleJailDetails(jail.name)"
                >{{ detailsJailName === jail.name ? "Hide manage" : "Manage" }}</Button>
                <Button size="sm" variant="destructive" @click="deleteJail(jail.name)">Delete</Button>
              </div>

              <div v-if="detailsJailName === jail.name" class="mt-3 rounded-md border border-border bg-muted/30 p-3">
                <p v-if="detailLoading" class="text-xs text-muted-foreground">Loading…</p>
                <template v-else-if="jailDetail">
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Image</p>
                      <p class="mt-1 font-mono text-xs">
                        {{ jailDetail.imageOs || "—" }} {{ jailDetail.imageRelease || "" }}
                      </p>
                    </div>
                    <div>
                      <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Profiles</p>
                      <p class="mt-1 font-mono text-xs">{{ jailDetail.profiles.join(", ") }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Storage pool</p>
                      <p class="mt-1 font-mono text-xs">{{ jailDetail.storagePool || "—" }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Bridge</p>
                      <p class="mt-1 font-mono text-xs">{{ jailDetail.networkBridge || "—" }}</p>
                    </div>
                  </div>

                  <div class="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
                    <div class="flex flex-wrap items-end gap-2">
                      <div>
                        <Label for="detail-cpu-limit" class="mb-1 flex items-center gap-1.5 text-xs">
                          CPU limit
                          <Badge v-if="jailDetail.cpuLimitIsOverride" variant="orange">override</Badge>
                        </Label>
                        <div class="flex gap-1.5">
                          <Input id="detail-cpu-limit" v-model="editCpuLimit" class="w-24 font-mono" placeholder="e.g. 2" />
                          <Button size="sm" variant="outline" :disabled="detailSaving" @click="saveJailCpuLimit">Apply</Button>
                        </div>
                      </div>
                      <div>
                        <Label for="detail-memory-limit" class="mb-1 flex items-center gap-1.5 text-xs">
                          Memory limit
                          <Badge v-if="jailDetail.memoryLimitIsOverride" variant="orange">override</Badge>
                        </Label>
                        <div class="flex gap-1.5">
                          <Input id="detail-memory-limit" v-model="editMemoryLimit" class="w-24 font-mono" placeholder="e.g. 4GiB" />
                          <Button size="sm" variant="outline" :disabled="detailSaving" @click="saveJailMemoryLimit">Apply</Button>
                        </div>
                      </div>
                      <Button
                        v-if="jailDetail.cpuLimitIsOverride || jailDetail.memoryLimitIsOverride"
                        size="sm"
                        variant="outline"
                        :disabled="detailSaving"
                        @click="resetJailLimits"
                      >Use profile default</Button>
                    </div>

                    <div>
                      <Label for="detail-workspace" class="mb-1 flex items-center gap-1.5 text-xs">
                        Workspace host path (/workspace)
                        <Badge v-if="jailDetail.workspaceIsOverride" variant="orange">override</Badge>
                      </Label>
                      <div class="flex gap-2">
                        <Input id="detail-workspace" v-model="editWorkspacePath" class="flex-1 font-mono" />
                        <Button size="sm" variant="outline" :disabled="detailSaving" @click="saveJailWorkspace">Apply</Button>
                        <Button
                          v-if="jailDetail.workspaceIsOverride"
                          size="sm"
                          variant="outline"
                          :disabled="detailSaving"
                          @click="resetJailWorkspace"
                        >Use profile default</Button>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="isOnSharedDefaultWorkspace(jailDetail)"
                    class="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs"
                  >
                    <span>
                      This container shares <span class="font-mono">/workspace</span> with every other
                      container still on the profile's default — file writes are live-visible between them.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      :disabled="migratingWorkspace"
                      @click="migrateJailWorkspace"
                    >{{ migratingWorkspace ? "Isolating…" : "Isolate this container's workspace" }}</Button>
                  </div>

                  <p v-if="detailError" class="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {{ detailError }}
                  </p>
                  <HelpText>
                    Values without an "override" badge are inherited straight from the container's profile
                    and apply to every container using it. Applying here overrides just this one instance —
                    it won't touch the profile or any other container. Memory limit changes need a restart
                    of this container to actually take effect on a running instance (verified: clearing an
                    override alone doesn't shrink an already-larger live cgroup limit back down). Isolating
                    a shared workspace points it at a new, empty per-container directory — it does not copy
                    any files already sitting in the old shared one.
                  </HelpText>

                  <div class="mt-4 border-t border-border pt-3">
                    <p class="mb-1 flex items-center gap-1.5 text-xs font-medium">
                      Sudo (agent user)
                      <Badge :variant="jailDetail.sudoEnabled ? 'green' : 'gray'">{{ jailDetail.sudoEnabled ? "enabled" : "disabled" }}</Badge>
                    </p>
                    <Button
                      v-if="!jailDetail.sudoEnabled"
                      size="sm"
                      variant="outline"
                      :disabled="grantingSudo"
                      @click="grantJailSudo"
                    >{{ grantingSudo ? "Granting…" : "Grant sudo (NOPASSWD)" }}</Button>
                    <HelpText>
                      Off by default on purpose — this is what keeps a compromised dependency from escalating
                      to root inside the container. Granting sudo here applies immediately to the running
                      container and can't be un-granted from this panel (remove
                      <span class="font-mono">/etc/sudoers.d/agent</span> manually, or via the privileged
                      command box below, if you need to revoke it).
                    </HelpText>
                  </div>

                  <div class="mt-4 border-t border-border pt-3">
                    <Label for="homebrew-formula" class="mb-1 block text-xs">Install a package (Homebrew)</Label>
                    <div class="flex flex-wrap gap-2">
                      <Input
                        id="homebrew-formula"
                        v-model="installFormula"
                        class="w-48 font-mono"
                        placeholder="e.g. wget"
                        @keydown.enter.prevent="installHomebrewFormula"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        :disabled="!installFormula.trim() || installingFormula"
                        @click="installHomebrewFormula"
                      >{{ installingFormula ? "Installing…" : "Install" }}</Button>
                    </div>
                    <p v-if="installResult" class="mt-1.5 text-xs text-unraid-green-800">{{ installResult }}</p>
                    <p v-if="installError" class="mt-1.5 text-xs text-destructive">{{ installError }}</p>
                    <HelpText>
                      Best-effort: bootstraps Homebrew itself under this container's non-root "agent" user
                      if it isn't already present (needs bash and git inside the container), installing to
                      <span class="font-mono">~/.linuxbrew</span> rather than Homebrew's usual shared system
                      path — the official installer needs <span class="font-mono">sudo</span> for that path,
                      and "agent" deliberately has none inside these containers. This runs against the LIVE
                      container over exec — it isn't baked into the image, so a rebuilt or replacement
                      container won't have it.
                    </HelpText>
                  </div>

                  <div class="mt-4 border-t border-border pt-3">
                    <Label for="privileged-command" class="mb-1 block text-xs">Run a privileged command</Label>
                    <div class="flex flex-wrap gap-2">
                      <Input
                        id="privileged-command"
                        v-model="privilegedCommand"
                        class="flex-1 font-mono"
                        placeholder="e.g. apt-get install -y htop"
                        @keydown.enter.prevent="runPrivilegedCommand"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        :disabled="!privilegedCommand.trim() || runningPrivilegedCommand"
                        @click="runPrivilegedCommand"
                      >{{ runningPrivilegedCommand ? "Running…" : "Run" }}</Button>
                    </div>
                    <div v-if="privilegedCommandStatus" class="mt-2">
                      <p class="text-xs" :class="privilegedCommandStatus.status === 'success' ? 'text-unraid-green-800' : 'text-destructive'">
                        {{ privilegedCommandStatus.message }}
                      </p>
                      <pre
                        v-if="privilegedCommandStatus.stdout || privilegedCommandStatus.stderr"
                        class="mt-1 max-h-40 overflow-auto rounded-md border border-neutral-800 bg-neutral-950 p-2 text-[11px] whitespace-pre-wrap text-neutral-200"
                      >{{ [privilegedCommandStatus.stdout, privilegedCommandStatus.stderr].filter(Boolean).join('\n') }}</pre>
                    </div>
                    <HelpText>
                      Runs as root, mediated by you here in the UI — the container's own "agent" user never
                      gets this capability, so this stays safe even with sudo left off. Good for one-off fixes
                      (a forgotten package) without needing the sudo toggle at all.
                    </HelpText>
                  </div>
                </template>
              </div>
            </div>
          </div>
          </template>
        </div>
      </section>

      <!-- Config tab -->
      <section v-else-if="activeTab === 'config'" id="incus-panel-config" role="tabpanel" aria-labelledby="incus-tab-config" tabindex="0">
        <!-- Three cards, one per group (Runtime / Network & Access / Container Defaults) — each
             group's related settings live in one card as sub-sections (h4 + divider), rather than
             splitting across multiple cards that each repeat the same eyebrow label. Cards flow
             through a 2-column masonry, balanced by actual content height. -->
        <div class="columns-1 gap-4 xl:columns-2">
        <section class="mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4">
          <p class="mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Runtime</p>
          <h3 class="mb-4 text-base font-semibold">Service</h3>
          <div class="grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4">
            <Label for="config-enabled">Enable Incus</Label>
            <Switch id="config-enabled" v-model="config.enabled" />
            <HelpText class="col-span-2">
              Starts incusd on array start. Leaving this off keeps the daemon — and its private-prefixed
              binaries under <span class="font-mono">/usr/local/incus/</span> — installed but never running.
            </HelpText>

            <Label for="config-dashboard-widget">Show Dashboard widget</Label>
            <Switch id="config-dashboard-widget" v-model="config.dashboardWidgetEnable" />
            <HelpText class="col-span-2">
              Shows a jail-status box (running/stopped/other counts) on Unraid's Main/Dashboard tab.
            </HelpText>

            <Label for="config-state-dir">Incus state directory</Label>
            <Input id="config-state-dir" v-model="config.stateDir" class="w-96 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              Where incusd keeps its database, storage pool, and container state. Must be real persistent
              storage on the array, not tmpfs — this is the one thing that survives a reboot or plugin update.
            </HelpText>
          </div>

          <div class="mt-4 border-t border-border pt-4">
            <h4 class="mb-3 text-sm font-semibold">Storage pool</h4>
            <div class="grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4">
              <Label for="config-storage-driver">Storage driver</Label>
              <Select id="config-storage-driver" v-model="config.storageDriver" class="w-56 justify-self-end">
                <option value="dir">dir (simple, no pool required)</option>
                <option value="zfs">zfs (snapshots/speed, needs existing pool)</option>
              </Select>
              <HelpText class="col-span-2">
                <span class="font-mono">dir</span> needs no existing pool and always works — it's the default for
                exactly that reason. <span class="font-mono">zfs</span> gets snapshots and speed, but the pool or
                dataset must already exist on your system; there's no safe way to auto-create one on your array.
              </HelpText>

              <template v-if="isZfs">
                <Label for="config-storage-source">ZFS pool/dataset</Label>
                <Input id="config-storage-source" v-model="config.storageSource" class="w-96 justify-self-end font-mono" />
                <HelpText class="col-span-2">
                  An existing pool or dataset path, e.g. <span class="font-mono">nvme/incus</span>. A dataset
                  under this path is created if missing, but the pool itself must already exist.
                </HelpText>
              </template>

              <Label for="config-storage-pool">Incus storage pool name</Label>
              <Input id="config-storage-pool" v-model="config.storagePoolName" class="w-48 justify-self-end font-mono" />
              <HelpText class="col-span-2">
                The name Incus itself uses for this storage pool internally — cosmetic, doesn't need to match
                anything else on the host.
              </HelpText>
            </div>
          </div>
        </section>

        <section class="mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4">
          <p class="mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Network &amp; Access</p>
          <h3 class="mb-4 text-base font-semibold">Network &amp; ACL (LAN-ban)</h3>
          <p class="mb-4 text-xs text-muted-foreground">
            Controls the bridge/subnet containers attach to and the firewall rules governing what they can reach.
          </p>
          <div class="grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4">
            <Label for="config-bridge">Container bridge</Label>
            <Input id="config-bridge" v-model="config.jailBridge" class="w-48 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              A dedicated NAT bridge name for containers, kept separate from Unraid's own br0 so container
              traffic never touches host networking directly.
            </HelpText>

            <Label for="config-subnet">Container subnet</Label>
            <Input id="config-subnet" v-model="config.jailSubnet" class="w-48 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              CIDR for the bridge. Defaults to an RFC 2544 benchmark range specifically because it won't
              collide with a typical home or office LAN.
            </HelpText>

            <Label for="config-nat">NAT</Label>
            <Switch id="config-nat" v-model="config.jailNat" />
            <HelpText class="col-span-2">
              Routes container traffic to the Internet through the host. Turning this off isolates containers
              with no outbound access at all — no Internet, no LAN.
            </HelpText>

            <Label for="config-ipv6">IPv6</Label>
            <Input
              id="config-ipv6"
              model-value="none"
              disabled
              readonly
              aria-describedby="config-ipv6-policy"
              class="w-48 justify-self-end font-mono"
            />
            <HelpText id="config-ipv6-policy" class="col-span-2">
              Fixed to <span class="font-mono">none</span>: IPv6 is deliberately fail-closed until the plugin can
              enforce isolation equivalent to the IPv4 ACL policy. Containers cannot enable it from this page.
            </HelpText>

            <Label for="config-acl-name">ACL name</Label>
            <Input id="config-acl-name" v-model="config.aclName" class="w-48 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              The name of the Incus network ACL that enforces the LAN ban — created and applied to the bridge
              by the array-start init script.
            </HelpText>

            <Label for="config-egress">Default egress action</Label>
            <Select id="config-egress" v-model="config.aclDefaultEgress" class="w-32 justify-self-end">
              <option value="allow">allow</option>
              <option value="drop">drop</option>
            </Select>

            <Label for="config-ingress">Default ingress action</Label>
            <Select id="config-ingress" v-model="config.aclDefaultIngress" class="w-32 justify-self-end">
              <option value="allow">allow</option>
              <option value="drop">drop</option>
            </Select>
            <HelpText class="col-span-2">
              What happens to traffic not covered by a rule above. Egress defaults to allow (deny-list model —
              Internet stays reachable unless explicitly blocked); ingress defaults to drop (nothing reaches
              a container unsolicited). Tailscale's CGNAT range (100.64.0.0/10) is blocked by default; add only
              the narrow allow-hole a container genuinely needs rather than exposing the whole tailnet.
            </HelpText>
          </div>

          <div class="mt-4 border-t border-border pt-4">
            <Label for="new-blocked-cidr" class="mb-1.5 block">Blocked CIDRs (deny-list)</Label>
            <div v-if="blockedCidrList.length > 0" class="mb-2 flex flex-wrap gap-1.5">
              <span
                v-for="cidr in blockedCidrList"
                :key="cidr"
                class="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
              >
                {{ cidr }}
                <button type="button" :aria-label="`Remove blocked CIDR ${cidr}`" class="cursor-pointer text-muted-foreground hover:text-destructive" @click="removeBlockedCidr(cidr)">✕</button>
              </span>
            </div>
            <div class="flex gap-2">
              <Input
                id="new-blocked-cidr"
                v-model="newBlockedCidr"
                class="w-full font-mono"
                placeholder="e.g. 10.0.0.0/8"
                @keydown.enter.prevent="addBlockedCidr"
              />
              <Button size="sm" variant="outline" :disabled="!newBlockedCidr.trim()" @click="addBlockedCidr">Add</Button>
            </div>
            <p v-if="blockedCidrError" class="mt-1.5 text-xs text-destructive">{{ blockedCidrError }}</p>
            <HelpText>
              Ranges containers may not reach — this is the actual LAN ban. Add one CIDR at a time; defaults to
              the private IPv4 ranges (RFC 1918) plus link-local addresses.
            </HelpText>
          </div>

          <div class="mt-4">
            <Label for="new-allow-cidr" class="mb-1.5 block">Allow-holes (punched before block rules)</Label>
            <div v-if="allowCidrList.length > 0" class="mb-2 flex flex-wrap gap-1.5">
              <span
                v-for="cidr in allowCidrList"
                :key="cidr"
                class="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs"
              >
                {{ cidr }}
                <button type="button" :aria-label="`Remove allowed CIDR ${cidr}`" class="cursor-pointer text-muted-foreground hover:text-destructive" @click="removeAllowCidr(cidr)">✕</button>
              </span>
            </div>
            <div class="flex gap-2">
              <Input
                id="new-allow-cidr"
                v-model="newAllowCidr"
                class="w-full font-mono"
                placeholder="e.g. 100.64.0.0/10"
                @keydown.enter.prevent="addAllowCidr"
              />
              <Button size="sm" variant="outline" :disabled="!newAllowCidr.trim()" @click="addAllowCidr">Add</Button>
            </div>
            <p v-if="allowCidrError" class="mt-1.5 text-xs text-destructive">{{ allowCidrError }}</p>
            <HelpText>
              Exceptions punched through the block list before it's evaluated — e.g. one specific internal
              service (a local LLM, a search index) a container legitimately needs to reach.
            </HelpText>
          </div>

          <div class="mt-4 border-t border-border pt-4">
            <h4 class="mb-3 text-sm font-semibold">Tailscale</h4>
            <p class="mb-4 text-xs text-muted-foreground">
              Optional — when set, new containers automatically join your tailnet using this key.
            </p>
            <div class="grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4">
              <Label for="tailscale-auth-key">Tailscale auth key</Label>
              <div class="flex justify-self-end gap-2">
                <Input
                  id="tailscale-auth-key"
                  v-model="tsAuthKeyReplacement"
                  :type="showTsAuthKey ? 'text' : 'password'"
                  class="w-72 font-mono"
                  :placeholder="config.tsAuthKeyConfigured ? 'Configured — enter a replacement' : 'tskey-auth-…'"
                />
                <Button size="sm" variant="outline" @click="showTsAuthKey = !showTsAuthKey">
                  {{ showTsAuthKey ? "Hide" : "Show" }}
                </Button>
                <Button
                  v-if="config.tsAuthKeyConfigured"
                  size="sm"
                  variant="outline"
                  @click="clearTsAuthKeyOnSave = !clearTsAuthKeyOnSave"
                >{{ clearTsAuthKeyOnSave ? "Keep key" : "Clear on save" }}</Button>
              </div>
              <HelpText class="col-span-2">
                The stored key is write-only and is never returned to this page. A reusable or ephemeral key
                from your Tailscale admin console. Best-effort: if a container's
                image doesn't have Tailscale installed, joining is silently skipped rather than failing the
                launch — it never blocks a container from starting.
              </HelpText>
            </div>
          </div>
        </section>

        <section class="mb-4 break-inside-avoid rounded-lg border border-border bg-card p-4">
          <p class="mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Container Defaults</p>
          <h3 class="mb-4 text-base font-semibold">Defaults</h3>
          <div class="grid max-w-xl grid-cols-[1fr_auto] items-center gap-y-4">
            <Label for="config-profile">Container profile</Label>
            <Input id="config-profile" v-model="config.jailProfile" class="w-48 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              The Incus profile new containers launch with — sets resource limits, network, and mounts, defined
              in the array-start init script's profile template.
            </HelpText>

            <Label for="config-image">Default image</Label>
            <Input id="config-image" v-model="config.jailImage" class="w-96 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              Used when launching a container without picking a specific image — either a remote reference like
              <span class="font-mono">images:debian/trixie/cloud</span>, or a locally-built image's alias.
              Marking an image as the golden master in the Builder tab sets this automatically.
            </HelpText>

            <Label for="config-nesting">Allow nesting</Label>
            <Switch id="config-nesting" v-model="config.jailNesting" />
            <HelpText class="col-span-2">
              Lets a container run Docker or Incus inside itself — needed for agents that spin up their own
              sandboxes, but widens what a compromised container could reach.
            </HelpText>

            <Label for="config-cpu">CPU limit</Label>
            <Input id="config-cpu" v-model="config.jailCpu" class="w-24 justify-self-end font-mono" placeholder="empty = no cap" />
            <p v-if="configCpuError" class="col-span-2 -mt-2 text-xs text-destructive">{{ configCpuError }}</p>

            <Label for="config-memory">Memory limit</Label>
            <Input id="config-memory" v-model="config.jailMemory" class="w-24 justify-self-end font-mono" placeholder="empty = no cap" />
            <p v-if="configMemoryError" class="col-span-2 -mt-2 text-xs text-destructive">{{ configMemoryError }}</p>
            <HelpText class="col-span-2">
              Hard resource ceiling applied via the container profile at launch — CPU as a core count (e.g.
              <span class="font-mono">2</span>), memory with a unit (e.g. <span class="font-mono">4GiB</span>). Leave either empty for no cap.
            </HelpText>

            <Label for="config-workspace">Workspace root</Label>
            <Input id="config-workspace" v-model="config.jailWorkspaceRoot" class="w-96 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              Host directory holding per-container workspaces, bind-mounted in with idmap shifting. Must be
              real persistent storage — the init script refuses to start if it's tmpfs, since that would
              silently lose "persistent" data on every reboot. Prefer a real device mount (e.g.
              <span class="font-mono">/mnt/cache/appdata/...</span>) over a <span class="font-mono">/mnt/user/...</span> path —
              Unraid's shfs FUSE union view generally doesn't support the idmapped-mount feature the shift needs.
            </HelpText>

            <Label for="config-agent-uid">Agent UID</Label>
            <Input id="config-agent-uid" v-model="config.jailAgentUid" class="w-24 justify-self-end font-mono" />

            <Label for="config-agent-gid">Agent GID</Label>
            <Input id="config-agent-gid" v-model="config.jailAgentGid" class="w-24 justify-self-end font-mono" />
            <HelpText class="col-span-2">
              The uid/gid inside each container mapped to your host user — match your own host user if you
              want files under the bind-mounted workspace to show correct ownership from outside the container.
            </HelpText>
          </div>

          <div class="mt-4 border-t border-border pt-4">
            <h4 class="mb-3 text-sm font-semibold">Bind mounts</h4>
            <Label for="config-bind-mounts" class="mb-2 block">Host config bind-mounts</Label>
            <Input id="config-bind-mounts" v-model="config.jailBindMounts" class="w-full font-mono" placeholder="/boot/config/plugins/incus/bind-mounts/claude:/home/agent/.claude:ro" />
            <p class="mt-2 text-xs text-muted-foreground">
              Comma-separated host:container[:ro|rw] triples from approved roots. Mounts default to read-only;
              only sources beneath the workspace root may be writable.
            </p>
            <HelpText>
              Copy curated agent config under <span class="font-mono">/boot/config/plugins/incus/bind-mounts</span>
              rather than exposing host home or system paths. Sources must resolve beneath that directory or the
              configured workspace root; config-root mounts are always read-only.
            </HelpText>
          </div>
        </section>
        </div>

        <div class="mb-8 flex justify-end">
          <Button :disabled="saving || !!configCpuError || !!configMemoryError" @click="applySettings">{{ saving ? "Applying…" : "Apply" }}</Button>
        </div>
      </section>
    </template>

    <Terminal v-if="consoleJail" :jail-name="consoleJail" @close="consoleJail = null" />
  </div>
</template>
