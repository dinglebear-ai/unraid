export const CONFIG_QUERY = `query { incusConfig {
  enabled stateDir storageDriver storageSource storagePoolName jailBridge jailSubnet jailNat jailIpv6
  aclName aclBlock aclAllow aclDefaultEgress aclDefaultIngress jailProfile jailImage jailNesting jailCpu jailMemory
  jailWorkspaceRoot jailAgentUid jailAgentGid jailBindMounts tsAuthKeyConfigured dashboardWidgetEnable
} }`;
export const STATUS_QUERY = `query { incusHealthy jails { name status ipv4 cpuUsageNs memoryUsageBytes memoryTotalBytes } }`;
export const UPDATE_CONFIG_MUTATION = `mutation($input: IncusConfigInput!) { updateIncusConfig(input: $input) { enabled } }`;
export const SET_JAIL_STATE_MUTATION = `mutation($name: String!, $action: JailAction!) { setJailState(name: $name, action: $action) }`;
export const DELETE_JAIL_MUTATION = `mutation($name: String!) { deleteJail(name: $name) }`;
export const LAUNCH_JAIL_MUTATION = `mutation($name: String!, $image: String, $allowSudo: Boolean) { launchJail(name: $name, image: $image, allowSudo: $allowSudo) }`;
export const JAIL_DETAIL_QUERY = `query($name: String!) { jailDetail(name: $name) { name profiles imageOs imageRelease imageDescription storagePool networkBridge cpuLimit cpuLimitIsOverride memoryLimit memoryLimitIsOverride workspaceHostPath workspaceIsOverride sudoEnabled } }`;
export const GRANT_JAIL_SUDO_MUTATION = `mutation($name: String!) { grantJailSudo(name: $name) }`;
export const START_PRIVILEGED_COMMAND_MUTATION = `mutation($name: String!, $command: String!) { startPrivilegedCommand(name: $name, command: $command) }`;
export const PRIVILEGED_COMMAND_STATUS_QUERY = `query($id: String!) { privilegedCommandStatus(id: $id) { id command status exitCode stdout stderr message } }`;
export const SET_JAIL_WORKSPACE_MUTATION = `mutation($name: String!, $hostPath: String!) { setJailWorkspace(name: $name, hostPath: $hostPath) }`;
export const CLEAR_JAIL_WORKSPACE_MUTATION = `mutation($name: String!) { clearJailWorkspace(name: $name) }`;
export const SET_JAIL_LIMITS_MUTATION = `mutation($name: String!, $cpu: String, $memory: String) { setJailLimits(name: $name, cpu: $cpu, memory: $memory) }`;
export const BUILD_JAIL_IMAGE_MUTATION = `mutation($distro: String!, $release: String!, $packages: [String!]!, $alias: String!, $basedOn: String, $postInstallCommands: [String!]) { buildJailImage(distro: $distro, release: $release, packages: $packages, alias: $alias, basedOn: $basedOn, postInstallCommands: $postInstallCommands) }`;
export const DELETE_JAIL_IMAGE_MUTATION = `mutation($alias: String!) { deleteJailImage(alias: $alias) }`;
export const SEARCH_ALL_PACKAGES_QUERY = `query($query: String!, $distro: String, $release: String) { searchAllPackages(query: $query, distro: $distro, release: $release) { results { ecosystem name description version } errors { ecosystem message } } }`;
export const BUILD_STATUS_QUERY = `query($buildId: String!) { jailImageBuildStatus(buildId: $buildId) { id status alias distro release packages logTail error } }`;
export const BUILDER_PRESETS_QUERY = `query { builderPresets { name distro release packages } }`;
export const SAVE_BUILDER_PRESET_MUTATION = `mutation($input: BuilderPresetInput!) { saveBuilderPreset(input: $input) { name } }`;
export const DELETE_BUILDER_PRESET_MUTATION = `mutation($name: String!) { deleteBuilderPreset(name: $name) }`;
export const JAIL_IMAGES_QUERY = `query { jailImages { alias distro release packages isMaster basedOn createdAt } }`;
export const SET_MASTER_IMAGE_MUTATION = `mutation($alias: String!, $isMaster: Boolean!) { setMasterImage(alias: $alias, isMaster: $isMaster) { alias isMaster } }`;
export const PRUNE_STALE_IMAGE_RECORDS_MUTATION = `mutation { pruneStaleImageRecords }`;
export const DELETE_STOPPED_JAILS_MUTATION = `mutation { deleteStoppedJails }`;
export const MIGRATE_JAIL_WORKSPACE_MUTATION = `mutation($name: String!) { migrateJailWorkspace(name: $name) }`;
export const INSTALL_HOMEBREW_FORMULA_MUTATION = `mutation($name: String!, $formula: String!) { installHomebrewFormula(name: $name, formula: $formula) }`;
export const HOMEBREW_INSTALL_STATUS_QUERY = `query($id: String!) { homebrewInstallStatus(id: $id) { id formula status message } }`;
