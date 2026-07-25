import { Module, Logger, Inject, Injectable } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigFilePersister } from "@unraid/shared/services/config-file.js";
import { configFeature, IncusConfig } from "./src/config.entity.js";
import { IncusService } from "./src/incus.service.js";
import { IncusResolver } from "./src/incus.resolver.js";
import { IncusConfigSyncService } from "./src/config-sync.service.js";
import { IncusExecService } from "./src/incus-exec.service.js";
import { IncusImageBuilderService } from "./src/incus-image-builder.service.js";
import { IncusBuilderPresetsService } from "./src/incus-builder-presets.service.js";
import { IncusPackageSearchService } from "./src/incus-package-search.service.js";
import { IncusUnixClient } from "./src/incus-unix-client.service.js";

/** Contract fields the unraid-api plugin loader validates against. */
export const adapter = "nestjs";

export const graphqlSchemaExtension = async () => `
  type Jail {
    name: String!
    status: String!
    ipv4: String
    cpuUsageNs: String
    memoryUsageBytes: String
    memoryTotalBytes: String
  }

  enum JailAction { start stop restart freeze unfreeze }
  enum JobStatus { running success failed }
  enum ImageBuildState { queued running success failed }

  type IncusConfig {
    enabled: Boolean!
    stateDir: String!
    storageDriver: String!
    storageSource: String!
    storagePoolName: String!
    jailBridge: String!
    jailSubnet: String!
    jailNat: Boolean!
    jailIpv6: String!
    aclName: String!
    aclBlock: String!
    aclAllow: String!
    aclDefaultEgress: String!
    aclDefaultIngress: String!
    jailProfile: String!
    jailImage: String!
    jailNesting: Boolean!
    jailCpu: String!
    jailMemory: String!
    jailWorkspaceRoot: String!
    jailAgentUid: String!
    jailAgentGid: String!
    jailBindMounts: String!
    tsAuthKeyConfigured: Boolean!
    dashboardWidgetEnable: Boolean!
  }

  input IncusConfigInput {
    enabled: Boolean
    stateDir: String
    storageDriver: String
    storageSource: String
    storagePoolName: String
    jailBridge: String
    jailSubnet: String
    jailNat: Boolean
    jailIpv6: String
    aclName: String
    aclBlock: String
    aclAllow: String
    aclDefaultEgress: String
    aclDefaultIngress: String
    jailProfile: String
    jailImage: String
    jailNesting: Boolean
    jailCpu: String
    jailMemory: String
    jailWorkspaceRoot: String
    jailAgentUid: String
    jailAgentGid: String
    jailBindMounts: String
    tsAuthKey: String
    dashboardWidgetEnable: Boolean
  }

  type JailDetail {
    name: String!
    profiles: [String!]!
    imageOs: String
    imageRelease: String
    imageDescription: String
    storagePool: String
    networkBridge: String
    cpuLimit: String
    cpuLimitIsOverride: Boolean!
    memoryLimit: String
    memoryLimitIsOverride: Boolean!
    workspaceHostPath: String
    workspaceIsOverride: Boolean!
    sudoEnabled: Boolean!
  }

  type PrivilegedCommandStatus {
    id: String!
    command: String!
    status: JobStatus!
    exitCode: Int
    stdout: String
    stderr: String
    message: String!
  }

  type HomebrewInstallStatus {
    id: String!
    formula: String!
    status: JobStatus!
    message: String!
  }

  type ImageBuildStatus {
    id: String!
    status: ImageBuildState!
    alias: String!
    distro: String!
    release: String!
    packages: [String!]!
    logTail: String!
    error: String
  }

  type BuilderPreset {
    name: String!
    distro: String!
    release: String!
    packages: [String!]!
  }

  input BuilderPresetInput {
    name: String!
    distro: String!
    release: String!
    packages: [String!]!
  }

  type ImageRecord {
    alias: String!
    distro: String!
    release: String!
    packages: [String!]!
    isMaster: Boolean!
    basedOn: String
    createdAt: String!
  }

  enum PackageEcosystem { apt npm pypi brew }

  type PackageSearchResult {
    ecosystem: String!
    name: String!
    description: String
    version: String
  }

  type PackageSearchError {
    ecosystem: String!
    message: String!
  }

  type PackageSearchResponse {
    results: [PackageSearchResult!]!
    errors: [PackageSearchError!]!
  }

  extend type Query {
    incusHealthy: Boolean!
    incusConfig: IncusConfig!
    jails: [Jail!]!
    jailDetail(name: String!): JailDetail!
    jailImageBuildStatus(buildId: String!): ImageBuildStatus
    homebrewInstallStatus(id: String!): HomebrewInstallStatus
    privilegedCommandStatus(id: String!): PrivilegedCommandStatus
    builderPresets: [BuilderPreset!]!
    jailImages: [ImageRecord!]!
    searchPackages(ecosystem: PackageEcosystem!, query: String!, distro: String, release: String): [PackageSearchResult!]!
    searchAllPackages(query: String!, distro: String, release: String): PackageSearchResponse!
  }

  extend type Mutation {
    updateIncusConfig(input: IncusConfigInput!): IncusConfig!
    launchJail(name: String!, image: String, allowSudo: Boolean): Boolean!
    setJailState(name: String!, action: JailAction!): Boolean!
    setJailWorkspace(name: String!, hostPath: String!): Boolean!
    clearJailWorkspace(name: String!): Boolean!
    migrateJailWorkspace(name: String!): String!
    setJailLimits(name: String!, cpu: String, memory: String): Boolean!
    deleteJail(name: String!): Boolean!
    deleteStoppedJails: [String!]!
    installHomebrewFormula(name: String!, formula: String!): String!
    grantJailSudo(name: String!): Boolean!
    startPrivilegedCommand(name: String!, command: String!): String!
    buildJailImage(distro: String!, release: String!, packages: [String!]!, alias: String!, basedOn: String, postInstallCommands: [String!]): String!
    saveBuilderPreset(input: BuilderPresetInput!): BuilderPreset!
    deleteBuilderPreset(name: String!): Boolean!
    setMasterImage(alias: String!, isMaster: Boolean!): ImageRecord!
    deleteJailImage(alias: String!): Boolean!
    pruneStaleImageRecords: [String!]!
    startJailExec(name: String!, cols: Int, rows: Int): String!
    sendJailExecInput(sessionId: String!, data: String!): Boolean!
    resizeJailExec(sessionId: String!, cols: Int!, rows: Int!): Boolean!
    stopJailExec(sessionId: String!): Boolean!
  }

  extend type Subscription {
    jailExecOutput(sessionId: String!): String!
  }
`;

@Injectable()
class IncusConfigPersister extends ConfigFilePersister<IncusConfig> {
  constructor(configService: ConfigService) {
    super(configService);
  }
  fileName(): string {
    return "incus.json";
  }
  configKey(): string {
    return "incus";
  }
  defaultConfig(): IncusConfig {
    return configFeature() as IncusConfig;
  }
}

@Module({
  imports: [ConfigModule.forFeature(configFeature)],
  providers: [
    IncusService,
    IncusUnixClient,
    IncusExecService,
    IncusImageBuilderService,
    IncusBuilderPresetsService,
    IncusPackageSearchService,
    IncusResolver,
    IncusConfigPersister,
    IncusConfigSyncService,
  ],
})
class IncusPluginModule {
  private readonly logger = new Logger(IncusPluginModule.name);
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  onModuleInit() {
    this.logger.log(`incus plugin initialized (state: ${this.config.get("incus.stateDir")})`);
  }
}

export const ApiModule = IncusPluginModule;
