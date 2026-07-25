export interface IncusConfig {
  enabled: boolean;
  stateDir: string;
  storageDriver: string;
  storageSource: string;
  storagePoolName: string;
  jailBridge: string;
  jailSubnet: string;
  jailNat: boolean;
  jailIpv6: string;
  aclName: string;
  aclBlock: string;
  aclAllow: string;
  aclDefaultEgress: string;
  aclDefaultIngress: string;
  jailProfile: string;
  jailImage: string;
  jailNesting: boolean;
  jailCpu: string;
  jailMemory: string;
  jailWorkspaceRoot: string;
  jailAgentUid: string;
  jailAgentGid: string;
  jailBindMounts: string;
  tsAuthKeyConfigured: boolean;
  dashboardWidgetEnable: boolean;
}

export interface Jail {
  name: string;
  status: string;
  ipv4?: string | null;
  cpuUsageNs?: string | null;
  memoryUsageBytes?: string | null;
  memoryTotalBytes?: string | null;
}

export type JailAction = "start" | "stop" | "restart" | "freeze" | "unfreeze";

export interface HomebrewInstallStatus {
  id: string;
  formula: string;
  status: "running" | "success" | "failed";
  message: string;
}

export interface JailDetail {
  name: string;
  profiles: string[];
  imageOs?: string | null;
  imageRelease?: string | null;
  imageDescription?: string | null;
  storagePool?: string | null;
  networkBridge?: string | null;
  cpuLimit?: string | null;
  cpuLimitIsOverride: boolean;
  memoryLimit?: string | null;
  memoryLimitIsOverride: boolean;
  workspaceHostPath?: string | null;
  workspaceIsOverride: boolean;
  sudoEnabled: boolean;
}

export interface PrivilegedCommandStatus {
  id: string;
  command: string;
  status: "running" | "success" | "failed";
  exitCode?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  message: string;
}

export interface ImageBuildStatus {
  id: string;
  status: "queued" | "running" | "success" | "failed";
  alias: string;
  distro: string;
  release: string;
  packages: string[];
  logTail: string;
  error?: string | null;
}

export interface BuilderPreset {
  name: string;
  distro: string;
  release: string;
  packages: string[];
}

export interface ImageRecord {
  alias: string;
  distro: string;
  release: string;
  packages: string[];
  isMaster: boolean;
  basedOn?: string | null;
  createdAt: string;
}

/** A single dropdown choice: value = exact string distrobuilder expects, label = display text. */
export interface DistroOption {
  value: string;
  label: string;
}

/** A curated package group offered as a checkbox for a given distro's package manager. */
export interface PackageGroupOption {
  key: string;
  label: string;
  packages: string[];
}

export type PackageEcosystem = "apt" | "npm" | "pypi" | "brew";

export interface PackageSearchResult {
  ecosystem: PackageEcosystem;
  name: string;
  description?: string | null;
  version?: string | null;
}

export interface PackageSearchError {
  ecosystem: PackageEcosystem;
  message: string;
}
