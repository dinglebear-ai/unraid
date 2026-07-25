//! Typed GraphQL operations (cynic) — **spike**.
//!
//! These mirror a couple of the hand-written queries in `graphql.rs`, but are
//! defined as Rust types checked against the vendored Unraid SDL at *compile
//! time* (see `build.rs`). The client runs them and serialises the typed result
//! straight back to `serde_json::Value`, so the rest of the stack (dispatch, CLI
//! formatters, MCP output, pagination) is unchanged — that's the migration
//! strategy under evaluation: typed at the wire, `Value` downstream.
//!
//! `#[cynic(...)]` drives the GraphQL mapping; `#[serde(...)]` drives the JSON we
//! emit downstream — both set to camelCase so the output matches the GraphQL
//! field names the formatters already expect.

/// The schema module the cynic derives resolve types against. Backed by the SDL
/// registered as `"unraid"` in `build.rs`.
#[cynic::schema("unraid")]
mod schema {}

// ── custom scalars (serialise transparently to their inner JSON type) ────────

#[derive(Clone, Debug, serde::Serialize)]
#[serde(transparent)]
struct BigIntValue(String);

#[derive(serde::Deserialize)]
#[serde(untagged)]
enum BigIntWireValue {
    String(String),
    Signed(i64),
    Unsigned(u64),
}

impl<'de> serde::Deserialize<'de> for BigIntValue {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let value = BigIntWireValue::deserialize(deserializer)?;
        Ok(Self(match value {
            BigIntWireValue::String(value) => value,
            BigIntWireValue::Signed(value) => value.to_string(),
            BigIntWireValue::Unsigned(value) => value.to_string(),
        }))
    }
}

/// Unraid emits `BigInt` as either a JSON number or string. Accept both wire
/// representations and normalize to a string so downstream output stays stable.
#[derive(cynic::Scalar, Clone, Debug)]
pub struct BigInt(BigIntValue);

#[derive(cynic::Scalar, Clone, Debug)]
pub struct PrefixedID(pub String);

#[derive(cynic::Scalar, Clone, Debug)]
pub struct DateTime(pub String);

/// `JSON` scalar — arbitrary JSON; wrap `serde_json::Value` so objects/arrays
/// round-trip (not just strings).
#[derive(cynic::Scalar, Clone, Debug)]
#[cynic(graphql_type = "JSON")]
pub struct Json(pub serde_json::Value);

/// `URL` scalar — arrives as a JSON string.
#[derive(cynic::Scalar, Clone, Debug)]
#[cynic(graphql_type = "URL")]
pub struct Url(pub String);

// ── flash ────────────────────────────────────────────────────────────────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct FlashQuery {
    pub flash: Flash,
}

// `guid` is intentionally omitted — it is non-null in the SDL but null at runtime.
#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Flash {
    pub id: PrefixedID,
    pub vendor: String,
    pub product: String,
}

// ── online / system_time / installed_unraid_plugins (first new-action batch) ──

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
pub struct OnlineQuery {
    pub online: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct SystemTimeQuery {
    pub system_time: SystemTime,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct SystemTime {
    pub current_time: String,
    pub time_zone: String,
    pub use_ntp: bool,
    pub ntp_servers: Vec<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct InstalledPluginsQuery {
    pub installed_unraid_plugins: Vec<String>,
}

// ── array (the stress test: nesting, lists, BigInt, 5 enums) ─────────────────
//
// Note: cynic structs map to a *selection*, not a type — so `parities`, `disks`,
// and `caches` (different field subsets of the same `ArrayDisk` type) each need
// their own struct. That selection-not-type rule is the main verbosity cost of
// the migration. All response parsing here is serde (`from_value`), so every
// type derives serde *and* the cynic derive that checks it against the SDL.

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct ArrayQuery {
    pub array: UnraidArray,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UnraidArray {
    pub state: ArrayState,
    pub capacity: ArrayCapacity,
    pub parity_check_status: ParityCheck,
    pub parities: Vec<ArrayDiskParity>,
    pub disks: Vec<ArrayDiskData>,
    pub caches: Vec<ArrayDiskCache>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArrayCapacity {
    pub kilobytes: Capacity,
    pub disks: Capacity,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
pub struct Capacity {
    pub free: String,
    pub used: String,
    pub total: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParityCheck {
    pub status: ParityCheckStatus,
    pub running: Option<bool>,
    pub progress: Option<i32>,
    pub speed: Option<String>,
    pub errors: Option<i32>,
    pub correcting: Option<bool>,
    pub paused: Option<bool>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ArrayDisk", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ArrayDiskParity {
    pub id: PrefixedID,
    pub name: Option<String>,
    pub device: Option<String>,
    pub size: Option<BigInt>,
    pub status: Option<ArrayDiskStatus>,
    pub temp: Option<i32>,
    pub num_errors: Option<BigInt>,
    #[cynic(rename = "type")]
    pub r#type: ArrayDiskType,
    pub is_spinning: Option<bool>,
    pub rotational: Option<bool>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ArrayDisk", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ArrayDiskData {
    pub id: PrefixedID,
    pub name: Option<String>,
    pub device: Option<String>,
    pub size: Option<BigInt>,
    pub status: Option<ArrayDiskStatus>,
    pub temp: Option<i32>,
    pub num_errors: Option<BigInt>,
    pub num_reads: Option<BigInt>,
    pub num_writes: Option<BigInt>,
    pub fs_size: Option<BigInt>,
    pub fs_free: Option<BigInt>,
    pub fs_used: Option<BigInt>,
    #[cynic(rename = "type")]
    pub r#type: ArrayDiskType,
    pub color: Option<ArrayDiskFsColor>,
    pub is_spinning: Option<bool>,
    pub rotational: Option<bool>,
    pub fs_type: Option<String>,
    pub comment: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ArrayDisk", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ArrayDiskCache {
    pub id: PrefixedID,
    pub name: Option<String>,
    pub device: Option<String>,
    pub size: Option<BigInt>,
    pub status: Option<ArrayDiskStatus>,
    pub temp: Option<i32>,
    pub num_errors: Option<BigInt>,
    pub fs_size: Option<BigInt>,
    pub fs_free: Option<BigInt>,
    pub fs_used: Option<BigInt>,
    #[cynic(rename = "type")]
    pub r#type: ArrayDiskType,
    pub color: Option<ArrayDiskFsColor>,
    pub is_spinning: Option<bool>,
    pub rotational: Option<bool>,
    pub fs_type: Option<String>,
}

// ── oidc: public providers / providers / configuration / isSSOEnabled ─────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
pub struct IsSsoEnabledQuery {
    #[cynic(rename = "isSSOEnabled")]
    #[serde(rename = "isSSOEnabled")]
    pub is_sso_enabled: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct PublicOidcProvidersQuery {
    pub public_oidc_providers: Vec<PublicOidcProvider>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct PublicOidcProvider {
    pub id: cynic::Id, // SDL: ID!
    pub name: String,
    pub button_text: Option<String>,
    pub button_icon: Option<String>,
    pub button_variant: Option<String>,
    pub button_style: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct OidcProvidersQuery {
    pub oidc_providers: Vec<OidcProvider>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OidcProvider {
    pub id: PrefixedID,
    pub name: String,
    pub client_id: String,
    pub issuer: Option<String>,
    pub authorization_endpoint: Option<String>,
    pub token_endpoint: Option<String>,
    pub jwks_uri: Option<String>,
    pub scopes: Vec<String>,
    pub authorization_rules: Option<Vec<OidcAuthorizationRule>>,
    pub authorization_rule_mode: Option<AuthorizationRuleMode>,
    pub button_text: Option<String>,
    pub button_icon: Option<String>,
    pub button_variant: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OidcAuthorizationRule {
    pub claim: String,
    pub operator: AuthorizationOperator,
    pub value: Vec<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct OidcConfigurationQuery {
    pub oidc_configuration: OidcConfiguration,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OidcConfiguration {
    pub providers: Vec<OidcProvider>,
    pub default_allowed_origins: Option<Vec<String>>,
}

// ── auth: api keys / roles / permissions / auth actions / form schema ─────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeysQuery {
    pub api_keys: Vec<ApiKey>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ApiKey {
    pub id: PrefixedID,
    pub key: String,
    pub name: String,
    pub description: Option<String>,
    pub roles: Vec<Role>,
    pub created_at: String,
    pub permissions: Vec<Permission>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
pub struct Permission {
    pub resource: Resource,
    pub actions: Vec<AuthAction>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyPossibleRolesQuery {
    pub api_key_possible_roles: Vec<Role>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyPossiblePermissionsQuery {
    pub api_key_possible_permissions: Vec<Permission>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AvailableAuthActionsQuery {
    pub get_available_auth_actions: Vec<AuthAction>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyCreationFormSchemaQuery {
    pub get_api_key_creation_form_schema: ApiKeyFormSettings,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyFormSettings {
    pub id: PrefixedID,
    pub data_schema: Json,
    pub ui_schema: Json,
    pub values: Json,
}

// `Resource` is hand-written (not via gql_enum!) because one SDL value,
// `CONNECT__REMOTE_ACCESS`, has a double underscore the macro can't emit.
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[allow(clippy::enum_variant_names)]
pub enum Resource {
    ActivationCode,
    ApiKey,
    Array,
    Cloud,
    Config,
    Connect,
    #[cynic(rename = "CONNECT__REMOTE_ACCESS")]
    ConnectRemoteAccess,
    Customizations,
    Dashboard,
    Disk,
    Display,
    Docker,
    Flash,
    Info,
    Logs,
    Me,
    Network,
    Notifications,
    Online,
    Os,
    Owner,
    Permission,
    Registration,
    Servers,
    Services,
    Share,
    Vars,
    Vms,
    Welcome,
}

// ── config / settings / display / customization / internalBootContext ─────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct ConfigQuery {
    pub config: Config,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub id: PrefixedID,
    pub valid: Option<bool>,
    pub error: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct SettingsQuery {
    pub settings: Settings,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub id: PrefixedID,
    pub unified: UnifiedSettings,
    pub api: ApiConfig,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UnifiedSettings {
    pub id: PrefixedID,
    pub data_schema: Json,
    pub ui_schema: Json,
    pub values: Json,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ApiConfig {
    pub version: String,
    pub extra_origins: Vec<String>,
    pub sandbox: Option<bool>,
    pub sso_sub_ids: Vec<String>,
    pub plugins: Vec<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct DisplayQuery {
    pub display: InfoDisplay,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InfoDisplay {
    pub id: PrefixedID,
    pub case: InfoDisplayCase,
    pub theme: ThemeName,
    pub unit: Temperature,
    pub scale: bool,
    pub tabs: bool,
    pub resize: bool,
    pub wwn: bool,
    pub total: bool,
    pub usage: bool,
    pub text: bool,
    pub warning: i32,
    pub critical: i32,
    pub hot: i32,
    pub max: Option<i32>,
    pub locale: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InfoDisplayCase {
    pub id: PrefixedID,
    pub url: String,
    pub icon: String,
    pub error: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct CustomizationQuery {
    pub customization: Option<Customization>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Customization {
    pub activation_code: Option<ActivationCode>,
    pub onboarding: Onboarding,
    pub available_languages: Option<Vec<Language>>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivationCode {
    pub code: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Onboarding {
    pub status: OnboardingStatus,
    pub is_partner_build: bool,
    pub completed: bool,
    pub completed_at_version: Option<String>,
    pub should_open: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Language {
    pub code: String,
    pub name: String,
    pub url: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct InternalBootContextQuery {
    pub internal_boot_context: OnboardingInternalBootContext,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingInternalBootContext {
    pub array_stopped: bool,
    pub boot_eligible: Option<bool>,
    pub booted_from_flash_with_internal_boot_setup: bool,
    pub enable_boot_transfer: Option<String>,
    pub reserved_names: Vec<String>,
    pub share_names: Vec<String>,
    pub pool_names: Vec<String>,
    pub drive_warnings: Vec<OnboardingInternalBootDriveWarning>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingInternalBootDriveWarning {
    pub disk_id: String,
    pub device: String,
    pub warnings: Vec<String>,
}

/// `ThemeName` SDL values are lowercase, so per-variant renames (the macro can't).
#[derive(cynic::Enum, Clone, Copy, Debug)]
pub enum ThemeName {
    #[cynic(rename = "azure")]
    Azure,
    #[cynic(rename = "black")]
    Black,
    #[cynic(rename = "gray")]
    Gray,
    #[cynic(rename = "white")]
    White,
}

// ── misc: me / owner / servers / fresh-install / theme / nics / tz / disks / …

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct MeQuery {
    pub me: UserAccount,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserAccount {
    pub id: PrefixedID,
    pub name: String,
    pub description: String,
    pub roles: Vec<Role>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct OwnerQuery {
    pub owner: Owner,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Owner {
    pub username: String,
    pub url: String,
    pub avatar: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct ServersQuery {
    pub servers: Vec<Server>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Server {
    pub id: PrefixedID,
    pub owner: ProfileModel,
    pub guid: String,
    pub name: String,
    pub comment: Option<String>,
    pub status: ServerStatus,
    pub wanip: String,
    pub lanip: String,
    pub localurl: String,
    pub remoteurl: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileModel {
    pub id: PrefixedID,
    pub username: String,
    pub url: String,
    pub avatar: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct IsFreshInstallQuery {
    pub is_fresh_install: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct PublicThemeQuery {
    pub public_theme: Theme,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    pub name: ThemeName,
    pub show_banner_image: bool,
    pub show_banner_gradient: bool,
    pub show_header_description: bool,
    pub header_background_color: Option<String>,
    pub header_primary_text_color: Option<String>,
    pub header_secondary_text_color: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct NetworkInterfacesQuery {
    pub network_interfaces: Vec<InfoNetworkInterface>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct InfoNetworkInterface {
    pub id: PrefixedID,
    pub name: String,
    pub description: Option<String>,
    pub mac_address: Option<String>,
    pub mtu: Option<i32>,
    pub speed: Option<i32>,
    pub duplex: Option<String>,
    pub internal: Option<bool>,
    #[cynic(rename = "virtual")]
    pub r#virtual: Option<bool>,
    pub operstate: Option<String>,
    #[cynic(rename = "type")]
    pub r#type: Option<String>,
    pub vlan_id: Option<i32>,
    pub status: Option<String>,
    pub protocol: Option<String>,
    pub ip_address: Option<String>,
    pub netmask: Option<String>,
    pub gateway: Option<String>,
    pub use_dhcp: Option<bool>,
    pub ipv6_address: Option<String>,
    pub ipv6_netmask: Option<String>,
    pub ipv6_gateway: Option<String>,
    pub use_dhcp6: Option<bool>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct TimeZoneOptionsQuery {
    pub time_zone_options: Vec<TimeZoneOption>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeZoneOption {
    pub value: String,
    pub label: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AssignableDisksQuery {
    pub assignable_disks: Vec<AssignableDisk>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Disk", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AssignableDisk {
    pub id: PrefixedID,
    pub device: String,
    #[cynic(rename = "type")]
    pub r#type: String,
    pub name: String,
    pub vendor: String,
    pub size: f64,
    pub serial_num: String,
    pub interface_type: DiskInterfaceType,
    pub smart_status: DiskSmartStatus,
    pub temperature: Option<f64>,
    pub is_spinning: bool,
    pub partitions: Vec<AssignableDiskPartition>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DiskPartition", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AssignableDiskPartition {
    pub name: String,
    pub fs_type: DiskFsType,
    pub size: f64,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct PluginInstallOperationsQuery {
    pub plugin_install_operations: Vec<PluginInstallOperation>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct PluginInstallOperation {
    pub id: cynic::Id,
    pub url: String,
    pub name: Option<String>,
    pub status: PluginInstallStatus,
    pub created_at: DateTime,
    pub updated_at: Option<DateTime>,
    pub finished_at: Option<DateTime>,
    pub output: Vec<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct CloudQuery {
    pub cloud: Cloud,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct Cloud {
    pub error: Option<String>,
    pub api_key: ApiKeyResponse,
    pub relay: Option<RelayResponse>,
    pub minigraphql: MinigraphqlResponse,
    pub cloud: CloudResponse,
    pub allowed_origins: Vec<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyResponse {
    pub valid: bool,
    pub error: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelayResponse {
    pub status: String,
    pub timeout: Option<String>,
    pub error: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MinigraphqlResponse {
    pub status: MinigraphStatus,
    pub timeout: Option<i32>,
    pub error: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudResponse {
    pub status: String,
    pub ip: Option<String>,
    pub error: Option<String>,
}

// ── arg-bearing read queries (cynic QueryVariables) ───────────────────────────

#[derive(cynic::QueryVariables)]
pub struct PrefixedIdVars {
    pub id: PrefixedID,
}

#[derive(cynic::QueryVariables)]
pub struct StringIdVars {
    pub id: String,
}

#[derive(cynic::QueryVariables)]
pub struct TokenVars {
    pub token: String,
}

#[derive(cynic::QueryVariables)]
pub struct OperationIdVars {
    pub operation_id: cynic::Id,
}

#[derive(cynic::QueryVariables)]
pub struct RolesVars {
    pub roles: Vec<Role>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "PrefixedIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyByIdQuery {
    #[arguments(id: $id)]
    pub api_key: Option<ApiKey>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", variables = "PrefixedIdVars")]
#[serde(rename_all = "camelCase")]
pub struct DiskByIdQuery {
    #[arguments(id: $id)]
    pub disk: AssignableDisk,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "PrefixedIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OidcProviderByIdQuery {
    #[arguments(id: $id)]
    pub oidc_provider: Option<OidcProvider>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "StringIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpsDeviceByIdQuery {
    #[arguments(id: $id)]
    pub ups_device_by_id: Option<UpsDevice>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "UPSDevice", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UpsDevice {
    pub id: cynic::Id,
    pub name: String,
    pub model: String,
    pub status: String,
    pub battery: UpsBattery,
    pub power: UpsPower,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "UPSBattery", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UpsBattery {
    pub charge_level: i32,
    pub estimated_runtime: i32,
    pub health: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "UPSPower", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UpsPower {
    pub input_voltage: f64,
    pub output_voltage: f64,
    pub load_percentage: i32,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "OperationIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct PluginInstallOperationByIdQuery {
    #[arguments(operationId: $operation_id)]
    pub plugin_install_operation: Option<PluginInstallOperation>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "TokenVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ValidateOidcSessionQuery {
    #[arguments(token: $token)]
    pub validate_oidc_session: OidcSessionValidation,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OidcSessionValidation {
    pub valid: bool,
    pub username: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "RolesVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct PermissionsForRolesQuery {
    #[arguments(roles: $roles)]
    pub get_permissions_for_roles: Vec<Permission>,
}

// ── mutations: notifications (first write batch) ──────────────────────────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Notification {
    pub id: PrefixedID,
    pub title: String,
    pub subject: String,
    pub description: String,
    pub importance: NotificationImportance,
    pub link: Option<String>,
    #[cynic(rename = "type")]
    pub r#type: NotificationType,
    pub timestamp: Option<String>,
    pub formatted_timestamp: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationOverview {
    pub unread: NotificationCounts,
    pub archive: NotificationCounts,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
pub struct NotificationCounts {
    pub info: i32,
    pub warning: i32,
    pub alert: i32,
    pub total: i32,
}

#[derive(cynic::InputObject, Debug, Clone)]
pub struct NotificationData {
    pub title: String,
    pub subject: String,
    pub description: String,
    pub importance: NotificationImportance,
    pub link: Option<String>,
}

#[derive(cynic::QueryVariables)]
pub struct CreateNotificationVars {
    pub input: NotificationData,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "CreateNotificationVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct CreateNotificationMutation {
    #[arguments(input: $input)]
    pub create_notification: Notification,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "PrefixedIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveNotificationMutation {
    #[arguments(id: $id)]
    pub archive_notification: Notification,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RecalculateOverviewMutation {
    pub recalculate_overview: NotificationOverview,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DeleteArchivedNotificationsMutation {
    pub delete_archived_notifications: NotificationOverview,
}

// ── mutations: vm namespace (id -> Boolean) ──

#[derive(cynic::QueryVariables)]
pub struct VmIdVars {
    pub id: PrefixedID,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "VmIdVars")]
#[serde(rename_all = "camelCase")]
pub struct VmStartMutation {
    pub vm: VmStartNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "VmMutations",
    variables = "VmIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct VmStartNs {
    #[arguments(id: $id)]
    pub start: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "VmIdVars")]
#[serde(rename_all = "camelCase")]
pub struct VmStopMutation {
    pub vm: VmStopNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "VmMutations",
    variables = "VmIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct VmStopNs {
    #[arguments(id: $id)]
    pub stop: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "VmIdVars")]
#[serde(rename_all = "camelCase")]
pub struct VmPauseMutation {
    pub vm: VmPauseNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "VmMutations",
    variables = "VmIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct VmPauseNs {
    #[arguments(id: $id)]
    pub pause: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "VmIdVars")]
#[serde(rename_all = "camelCase")]
pub struct VmResumeMutation {
    pub vm: VmResumeNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "VmMutations",
    variables = "VmIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct VmResumeNs {
    #[arguments(id: $id)]
    pub resume: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "VmIdVars")]
#[serde(rename_all = "camelCase")]
pub struct VmForceStopMutation {
    pub vm: VmForceStopNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "VmMutations",
    variables = "VmIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct VmForceStopNs {
    #[arguments(id: $id)]
    pub force_stop: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "VmIdVars")]
#[serde(rename_all = "camelCase")]
pub struct VmRebootMutation {
    pub vm: VmRebootNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "VmMutations",
    variables = "VmIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct VmRebootNs {
    #[arguments(id: $id)]
    pub reboot: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "VmIdVars")]
#[serde(rename_all = "camelCase")]
pub struct VmResetMutation {
    pub vm: VmResetNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "VmMutations",
    variables = "VmIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct VmResetNs {
    #[arguments(id: $id)]
    pub reset: bool,
}

// ── mutations: docker namespace ──────────────────────────────────────────────
//
// Requires the ContainerState enum (add near the other gql_enum! calls):
//   gql_enum!(ContainerState { Running, Paused, Exited });

/// Partial selection of `DockerContainer` returned by the lifecycle mutations.
/// Sub-struct: derives QueryFragment + Serialize only (cynic provides Deserialize).
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DockerContainer")]
#[serde(rename_all = "camelCase")]
pub struct DockerContainerRef {
    pub id: PrefixedID,
    pub names: Vec<String>,
    pub image: String,
    pub state: ContainerState,
    pub status: String,
}

// ---- Variables -------------------------------------------------------------

/// Single-id arg shared by start/stop/pause/unpause/updateContainer.
#[derive(cynic::QueryVariables)]
pub struct DockerIdVars {
    pub id: PrefixedID,
}

/// removeContainer(id, withImage): id required, withImage nullable Boolean.
#[derive(cynic::QueryVariables)]
pub struct DockerRemoveVars {
    pub id: PrefixedID,
    pub with_image: Option<bool>,
}

/// updateContainers(ids: [PrefixedID!]!).
#[derive(cynic::QueryVariables)]
pub struct DockerIdsVars {
    pub ids: Vec<PrefixedID>,
}

// ---- start -----------------------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerIdVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerStartMutation {
    pub docker: DockerStartNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerStartNs {
    #[arguments(id: $id)]
    pub start: DockerContainerRef,
}

// ---- stop ------------------------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerIdVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerStopMutation {
    pub docker: DockerStopNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerStopNs {
    #[arguments(id: $id)]
    pub stop: DockerContainerRef,
}

// ---- restart ---------------------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerIdVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerRestartMutation {
    pub docker: DockerRestartNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerRestartNs {
    #[arguments(id: $id)]
    pub restart: DockerContainerRef,
}

// ---- pause -----------------------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerIdVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerPauseMutation {
    pub docker: DockerPauseNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerPauseNs {
    #[arguments(id: $id)]
    pub pause: DockerContainerRef,
}

// ---- unpause ---------------------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerIdVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerUnpauseMutation {
    pub docker: DockerUnpauseNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerUnpauseNs {
    #[arguments(id: $id)]
    pub unpause: DockerContainerRef,
}

// ---- removeContainer(id, withImage) -> Boolean! ----------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerRemoveVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerRemoveContainerMutation {
    pub docker: DockerRemoveContainerNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerRemoveVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerRemoveContainerNs {
    #[arguments(id: $id, withImage: $with_image)]
    pub remove_container: bool,
}

// ---- updateContainer(id) -> DockerContainer! -------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerIdVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateContainerMutation {
    pub docker: DockerUpdateContainerNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateContainerNs {
    #[arguments(id: $id)]
    pub update_container: DockerContainerRef,
}

// ---- updateContainers(ids) -> [DockerContainer!]! --------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DockerIdsVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateContainersMutation {
    pub docker: DockerUpdateContainersNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "DockerIdsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateContainersNs {
    #[arguments(ids: $ids)]
    pub update_containers: Vec<DockerContainerRef>,
}

// ---- updateAllContainers -> [DockerContainer!]! (no args) ------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateAllContainersMutation {
    pub docker: DockerUpdateAllContainersNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DockerMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateAllContainersNs {
    pub update_all_containers: Vec<DockerContainerRef>,
}

// ── mutations: array namespace ───────────────────────────────────────────────
//
// `mutation { array { <op> } }`. Same two-struct-per-op shape as the VM
// namespace: a `Mutation`-root struct selecting the `array` field, and an
// `ArrayMutations`-typed namespace struct selecting the op with #[arguments(...)].
// setState/addDiskToArray/removeDiskFromArray return UnraidArray! -> UnraidArrayRef
// (minimal { id state }); mount/unmount return ArrayDisk! -> ArrayDiskRef
// ({ id name status }); clearArrayDiskStatistics returns Boolean! -> bool.

/// Minimal `UnraidArray` selection for mutation results ({ id state }).
/// Distinct from the read-path `UnraidArray` struct because a cynic struct maps
/// to a *selection*, not a type.
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "UnraidArray", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UnraidArrayRef {
    pub id: PrefixedID,
    pub state: ArrayState,
}

/// Minimal `ArrayDisk` selection for mount/unmount results ({ id name status }).
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ArrayDisk", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ArrayDiskRef {
    pub id: PrefixedID,
    pub name: Option<String>,
    pub status: Option<ArrayDiskStatus>,
}

// input objects

#[derive(cynic::InputObject, Debug, Clone)]
#[cynic(rename_all = "camelCase")]
pub struct ArrayStateInput {
    pub desired_state: ArrayStateInputState,
    /// Optional password used to unlock encrypted array disks when starting the array.
    pub decryption_password: Option<String>,
    /// Optional keyfile contents (data URL or raw base64) used to unlock encrypted
    /// array disks when starting the array.
    pub decryption_keyfile: Option<String>,
}

#[derive(cynic::InputObject, Debug, Clone)]
#[cynic(rename_all = "camelCase")]
pub struct ArrayDiskInput {
    pub id: PrefixedID,
    pub slot: Option<i32>,
}

// arg-bearing variables

#[derive(cynic::QueryVariables)]
pub struct ArrayStateInputVars {
    pub input: ArrayStateInput,
}

#[derive(cynic::QueryVariables)]
pub struct ArrayDiskInputVars {
    pub input: ArrayDiskInput,
}

#[derive(cynic::QueryVariables)]
pub struct ArrayDiskIdVars {
    pub id: PrefixedID,
}

// setState(input: ArrayStateInput!): UnraidArray!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "ArrayStateInputVars")]
#[serde(rename_all = "camelCase")]
pub struct ArraySetStateMutation {
    pub array: ArraySetStateNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ArrayMutations",
    variables = "ArrayStateInputVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArraySetStateNs {
    #[arguments(input: $input)]
    pub set_state: UnraidArrayRef,
}

// addDiskToArray(input: ArrayDiskInput!): UnraidArray!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "ArrayDiskInputVars")]
#[serde(rename_all = "camelCase")]
pub struct ArrayAddDiskToArrayMutation {
    pub array: ArrayAddDiskToArrayNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ArrayMutations",
    variables = "ArrayDiskInputVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArrayAddDiskToArrayNs {
    #[arguments(input: $input)]
    pub add_disk_to_array: UnraidArrayRef,
}

// removeDiskFromArray(input: ArrayDiskInput!): UnraidArray!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "ArrayDiskInputVars")]
#[serde(rename_all = "camelCase")]
pub struct ArrayRemoveDiskFromArrayMutation {
    pub array: ArrayRemoveDiskFromArrayNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ArrayMutations",
    variables = "ArrayDiskInputVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArrayRemoveDiskFromArrayNs {
    #[arguments(input: $input)]
    pub remove_disk_from_array: UnraidArrayRef,
}

// mountArrayDisk(id: PrefixedID!): ArrayDisk!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "ArrayDiskIdVars")]
#[serde(rename_all = "camelCase")]
pub struct ArrayMountArrayDiskMutation {
    pub array: ArrayMountArrayDiskNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ArrayMutations",
    variables = "ArrayDiskIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArrayMountArrayDiskNs {
    #[arguments(id: $id)]
    pub mount_array_disk: ArrayDiskRef,
}

// unmountArrayDisk(id: PrefixedID!): ArrayDisk!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "ArrayDiskIdVars")]
#[serde(rename_all = "camelCase")]
pub struct ArrayUnmountArrayDiskMutation {
    pub array: ArrayUnmountArrayDiskNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ArrayMutations",
    variables = "ArrayDiskIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArrayUnmountArrayDiskNs {
    #[arguments(id: $id)]
    pub unmount_array_disk: ArrayDiskRef,
}

// clearArrayDiskStatistics(id: PrefixedID!): Boolean!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "ArrayDiskIdVars")]
#[serde(rename_all = "camelCase")]
pub struct ArrayClearArrayDiskStatisticsMutation {
    pub array: ArrayClearArrayDiskStatisticsNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ArrayMutations",
    variables = "ArrayDiskIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArrayClearArrayDiskStatisticsNs {
    #[arguments(id: $id)]
    pub clear_array_disk_statistics: bool,
}

// ── mutations: parityCheck namespace ─────────────────────────────────────────
//
// `mutation { parityCheck { <op> } }`. start takes (correct: Boolean!); the
// other three take no args. All return JSON! -> the existing `Json` scalar.

#[derive(cynic::QueryVariables)]
pub struct ParityCheckStartVars {
    pub correct: bool,
}

// start(correct: Boolean!): JSON!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "ParityCheckStartVars")]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckStartMutation {
    pub parity_check: ParityCheckStartNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ParityCheckMutations",
    variables = "ParityCheckStartVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckStartNs {
    #[arguments(correct: $correct)]
    pub start: Json,
}

// pause: JSON!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckPauseMutation {
    pub parity_check: ParityCheckPauseNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ParityCheckMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckPauseNs {
    pub pause: Json,
}

// resume: JSON!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckResumeMutation {
    pub parity_check: ParityCheckResumeNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ParityCheckMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckResumeNs {
    pub resume: Json,
}

// cancel: JSON!

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckCancelMutation {
    pub parity_check: ParityCheckCancelNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ParityCheckMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityCheckCancelNs {
    pub cancel: Json,
}

// new enum (input-side; SDL values are UPPER so SCREAMING_SNAKE rename maps cleanly)

// ── mutations: apiKey / rclone / unraidPlugins / onboarding namespaces ─────────

// --- input objects (outbound variables only; no serde derive needed) ----------

#[derive(cynic::InputObject, Debug, Clone)]
pub struct AddPermissionInput {
    pub resource: Resource,
    pub actions: Vec<AuthAction>, // [AuthAction!]! → non-null list
}

#[derive(cynic::InputObject, Debug, Clone)]
pub struct CreateApiKeyInput {
    pub name: String,
    pub description: Option<String>,
    pub roles: Option<Vec<Role>>,
    pub permissions: Option<Vec<AddPermissionInput>>,
    pub overwrite: Option<bool>,
}

#[derive(cynic::InputObject, Debug, Clone)]
#[cynic(rename_all = "camelCase")]
pub struct AddRoleForApiKeyInput {
    pub api_key_id: PrefixedID,
    pub role: Role,
}

#[derive(cynic::InputObject, Debug, Clone)]
#[cynic(rename_all = "camelCase")]
pub struct RemoveRoleFromApiKeyInput {
    pub api_key_id: PrefixedID,
    pub role: Role,
}

#[derive(cynic::InputObject, Debug, Clone)]
pub struct DeleteApiKeyInput {
    pub ids: Vec<PrefixedID>, // [PrefixedID!]!
}

#[derive(cynic::InputObject, Debug, Clone)]
pub struct UpdateApiKeyInput {
    pub id: PrefixedID,
    pub name: Option<String>,
    pub description: Option<String>,
    pub roles: Option<Vec<Role>>,
    pub permissions: Option<Vec<AddPermissionInput>>,
}

#[derive(cynic::InputObject, Debug, Clone)]
pub struct CreateRCloneRemoteInput {
    pub name: String,
    #[cynic(rename = "type")]
    pub r#type: String,
    pub parameters: Json,
}

#[derive(cynic::InputObject, Debug, Clone)]
pub struct DeleteRCloneRemoteInput {
    pub name: String,
}

#[derive(cynic::InputObject, Debug, Clone)]
pub struct InstallPluginInput {
    pub url: String,
    pub name: Option<String>,
    pub forced: Option<bool>,
}

// The structs below derive `serde::Deserialize` (no rename_all — Rust field
// names match the snake_case JSON keys MCP callers send) alongside
// `cynic::InputObject` (which maps those same fields to camelCase on the wire),
// same dual-derive pattern as `UPSConfigInput`/`TemperatureConfigInput`. cynic's
// `Scalar` derive is transparent to serde (see the `Json`/`BigInt` doc comments
// above), so `PrefixedID`/`Url`/`Json` fields deserialize like their inner type.

// SDL declares `preferred_username` as literal snake_case (not camelCase like its siblings).
#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
pub struct ConnectUserInfoInput {
    #[cynic(rename = "preferred_username")]
    pub preferred_username: String,
    pub email: String,
    pub avatar: Option<String>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct ConnectSignInInput {
    pub api_key: String,
    pub user_info: Option<ConnectUserInfoInput>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct SetupRemoteAccessInput {
    pub access_type: WanAccessType,
    pub forward_type: Option<WanForwardType>,
    pub port: Option<i32>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct AccessUrlInput {
    #[cynic(rename = "type")]
    pub r#type: UrlType,
    pub name: Option<String>,
    pub ipv4: Option<Url>,
    pub ipv6: Option<Url>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct EnableDynamicRemoteAccessInput {
    pub url: AccessUrlInput,
    pub enabled: bool,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct ConnectSettingsInput {
    pub access_type: Option<WanAccessType>,
    pub forward_type: Option<WanForwardType>,
    pub port: Option<i32>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct UpdateSshInput {
    pub enabled: bool,
    pub port: i32,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct InitiateFlashBackupInput {
    pub remote_name: String,
    pub source_path: String,
    pub destination_path: String,
    pub options: Option<Json>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct DockerAutostartEntryInput {
    pub id: PrefixedID,
    pub auto_start: bool,
    pub wait: Option<i32>,
}

// ── onboarding override input tree (deep, admin/debug-only surface) ───────────

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
pub struct PartnerLinkInput {
    pub title: String,
    pub url: String,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct PartnerConfigInput {
    pub name: Option<String>,
    pub url: Option<String>,
    pub hardware_specs_url: Option<String>,
    pub manual_url: Option<String>,
    pub support_url: Option<String>,
    pub extra_links: Option<Vec<PartnerLinkInput>>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct BrandingConfigInput {
    pub header: Option<String>,
    pub headermetacolor: Option<String>,
    pub background: Option<String>,
    pub show_banner_gradient: Option<bool>,
    pub theme: Option<String>,
    pub banner_image: Option<String>,
    pub case_model: Option<String>,
    pub case_model_image: Option<String>,
    pub partner_logo_light_url: Option<String>,
    pub partner_logo_dark_url: Option<String>,
    pub has_partner_logo: Option<bool>,
    pub onboarding_title: Option<String>,
    pub onboarding_subtitle: Option<String>,
    pub onboarding_title_fresh_install: Option<String>,
    pub onboarding_subtitle_fresh_install: Option<String>,
    pub onboarding_title_upgrade: Option<String>,
    pub onboarding_subtitle_upgrade: Option<String>,
    pub onboarding_title_downgrade: Option<String>,
    pub onboarding_subtitle_downgrade: Option<String>,
    pub onboarding_title_incomplete: Option<String>,
    pub onboarding_subtitle_incomplete: Option<String>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct SystemConfigInput {
    pub server_name: Option<String>,
    pub model: Option<String>,
    pub comment: Option<String>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
pub struct ActivationCodeOverrideInput {
    pub code: Option<String>,
    pub partner: Option<PartnerConfigInput>,
    pub branding: Option<BrandingConfigInput>,
    pub system: Option<SystemConfigInput>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct PartnerInfoOverrideInput {
    pub partner: Option<PartnerConfigInput>,
    pub branding: Option<BrandingConfigInput>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct OnboardingOverrideCompletionInput {
    pub completed: Option<bool>,
    pub completed_at_version: Option<String>,
    pub force_open: Option<bool>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct OnboardingOverrideInput {
    pub onboarding: Option<OnboardingOverrideCompletionInput>,
    pub activation_code: Option<ActivationCodeOverrideInput>,
    pub partner_info: Option<PartnerInfoOverrideInput>,
    pub registration_state: Option<RegistrationState>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "camelCase")]
pub struct CreateInternalBootPoolInput {
    pub pool_name: String,
    pub devices: Vec<String>,
    pub boot_size_mi_b: i32,
    pub update_bios: bool,
    pub reboot: Option<bool>,
}

// Note: InputObject field renaming — cynic InputObject does NOT honor a struct-level
// `rename_all`, so snake_case Rust fields (`api_key_id`) map to camelCase SDL
// (`apiKeyId`) automatically ONLY if you add `#[cynic(rename_all = "camelCase")]`.
// To be safe and explicit, the derives above rely on cynic's default camelCase
// mapping for input objects. If the build rejects `api_key_id`, add
// `#[cynic(rename_all = "camelCase")]` to AddRoleForApiKeyInput / RemoveRoleFromApiKeyInput.

// --- new response-selection refs ----------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Onboarding", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingRef {
    pub status: OnboardingStatus,
    pub completed: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "RCloneRemote", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RCloneRemoteRef {
    pub name: String,
    #[cynic(rename = "type")]
    pub r#type: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ConnectSettingsValues", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ConnectSettingsValuesRef {
    pub access_type: WanAccessType,
    pub forward_type: Option<WanForwardType>,
    pub port: Option<i32>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "UpdateSettingsResponse", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingsResponseRef {
    pub restart_required: bool,
    pub values: Json,
    pub warnings: Option<Vec<String>>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "FlashBackupStatus", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct FlashBackupStatusRef {
    pub status: String,
    pub job_id: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DockerTemplateSyncResult", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DockerTemplateSyncResultRef {
    pub scanned: i32,
    pub matched: i32,
    pub skipped: i32,
    pub errors: Vec<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "OnboardingInternalBootResult",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingInternalBootResultRef {
    pub ok: bool,
    pub code: Option<i32>,
    pub output: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "OnboardingInternalBootDriveWarning",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingInternalBootDriveWarningRef {
    pub disk_id: String,
    pub device: String,
    pub warnings: Vec<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "OnboardingInternalBootContext",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingInternalBootContextRef {
    pub array_stopped: bool,
    pub boot_eligible: Option<bool>,
    pub booted_from_flash_with_internal_boot_setup: bool,
    pub enable_boot_transfer: Option<String>,
    pub reserved_names: Vec<String>,
    pub share_names: Vec<String>,
    pub pool_names: Vec<String>,
    pub assignable_disks: Vec<AssignableDisk>,
    pub drive_warnings: Vec<OnboardingInternalBootDriveWarningRef>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "FlatOrganizerEntry", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct FlatOrganizerEntryRef {
    pub id: String,
    #[cynic(rename = "type")]
    pub r#type: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub depth: f64,
    pub position: f64,
    pub path: Vec<String>,
    pub has_children: bool,
    pub children_ids: Vec<String>,
    pub meta: Option<DockerContainerRef>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ResolvedOrganizerView", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOrganizerViewRef {
    pub id: String,
    pub name: String,
    pub root_id: String,
    pub flat_entries: Vec<FlatOrganizerEntryRef>,
    pub prefs: Option<Json>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ResolvedOrganizerV1", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOrganizerV1Ref {
    pub version: f64,
    pub views: Vec<ResolvedOrganizerViewRef>,
}

// --- variables ----------------------------------------------------------------

#[derive(cynic::QueryVariables)]
pub struct CreateApiKeyVars {
    pub input: CreateApiKeyInput,
}
#[derive(cynic::QueryVariables)]
pub struct AddRoleForApiKeyVars {
    pub input: AddRoleForApiKeyInput,
}
#[derive(cynic::QueryVariables)]
pub struct RemoveRoleFromApiKeyVars {
    pub input: RemoveRoleFromApiKeyInput,
}
#[derive(cynic::QueryVariables)]
pub struct DeleteApiKeyVars {
    pub input: DeleteApiKeyInput,
}
#[derive(cynic::QueryVariables)]
pub struct UpdateApiKeyVars {
    pub input: UpdateApiKeyInput,
}
#[derive(cynic::QueryVariables)]
pub struct CreateRCloneRemoteVars {
    pub input: CreateRCloneRemoteInput,
}
#[derive(cynic::QueryVariables)]
pub struct DeleteRCloneRemoteVars {
    pub input: DeleteRCloneRemoteInput,
}
#[derive(cynic::QueryVariables)]
pub struct InstallPluginVars {
    pub input: InstallPluginInput,
}
#[derive(cynic::QueryVariables)]
pub struct SetLocaleVars {
    pub locale: String,
}
#[derive(cynic::QueryVariables)]
pub struct SetThemeVars {
    pub theme: ThemeName,
}
#[derive(cynic::QueryVariables)]
pub struct CreateDockerFolderVars {
    pub name: String,
    pub parent_id: Option<String>,
    pub children_ids: Option<Vec<String>>,
}
#[derive(cynic::QueryVariables)]
pub struct CreateDockerFolderWithItemsVars {
    pub name: String,
    pub parent_id: Option<String>,
    pub source_entry_ids: Option<Vec<String>>,
    pub position: Option<f64>,
}
#[derive(cynic::QueryVariables)]
pub struct SetDockerFolderChildrenVars {
    pub folder_id: Option<String>,
    pub children_ids: Vec<String>,
}
#[derive(cynic::QueryVariables)]
pub struct DeleteDockerEntriesVars {
    pub entry_ids: Vec<String>,
}
#[derive(cynic::QueryVariables)]
pub struct MoveDockerEntriesToFolderVars {
    pub source_entry_ids: Vec<String>,
    pub destination_folder_id: String,
}
#[derive(cynic::QueryVariables)]
pub struct MoveDockerItemsToPositionVars {
    pub source_entry_ids: Vec<String>,
    pub destination_folder_id: String,
    pub position: f64,
}
#[derive(cynic::QueryVariables)]
pub struct RenameDockerFolderVars {
    pub folder_id: String,
    pub new_name: String,
}
#[derive(cynic::QueryVariables)]
pub struct UpdateDockerViewPreferencesVars {
    pub view_id: Option<String>,
    pub prefs: Json,
}
#[derive(cynic::QueryVariables)]
pub struct UpdateAutostartConfigurationVars {
    pub entries: Vec<DockerAutostartEntryInput>,
    pub persist_user_preferences: Option<bool>,
}
#[derive(cynic::QueryVariables)]
pub struct ConnectSignInVars {
    pub input: ConnectSignInInput,
}
#[derive(cynic::QueryVariables)]
pub struct SetupRemoteAccessVars {
    pub input: SetupRemoteAccessInput,
}
#[derive(cynic::QueryVariables)]
pub struct EnableDynamicRemoteAccessVars {
    pub input: EnableDynamicRemoteAccessInput,
}
#[derive(cynic::QueryVariables)]
pub struct UpdateApiSettingsVars {
    pub input: ConnectSettingsInput,
}
#[derive(cynic::QueryVariables)]
pub struct UpdateSettingsVars {
    pub input: Json,
}
#[derive(cynic::QueryVariables)]
pub struct UpdateSshSettingsVars {
    pub input: UpdateSshInput,
}
#[derive(cynic::QueryVariables)]
pub struct InitiateFlashBackupVars {
    pub input: InitiateFlashBackupInput,
}
#[derive(cynic::QueryVariables)]
pub struct NotifyIfUniqueVars {
    pub input: NotificationData,
}
#[derive(cynic::QueryVariables)]
pub struct SetOnboardingOverrideVars {
    pub input: OnboardingOverrideInput,
}
#[derive(cynic::QueryVariables)]
pub struct CreateInternalBootPoolVars {
    pub input: CreateInternalBootPoolInput,
}
#[derive(cynic::QueryVariables)]
pub struct PreviewEffectivePermissionsVars {
    pub roles: Option<Vec<Role>>,
    pub permissions: Option<Vec<AddPermissionInput>>,
}

// --- apiKey namespace ---------------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "CreateApiKeyVars")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyCreateMutation {
    pub api_key: ApiKeyCreateNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ApiKeyMutations",
    variables = "CreateApiKeyVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyCreateNs {
    #[arguments(input: $input)]
    pub create: ApiKey,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "AddRoleForApiKeyVars")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyAddRoleMutation {
    pub api_key: ApiKeyAddRoleNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ApiKeyMutations",
    variables = "AddRoleForApiKeyVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyAddRoleNs {
    #[arguments(input: $input)]
    pub add_role: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "RemoveRoleFromApiKeyVars")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyRemoveRoleMutation {
    pub api_key: ApiKeyRemoveRoleNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ApiKeyMutations",
    variables = "RemoveRoleFromApiKeyVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyRemoveRoleNs {
    #[arguments(input: $input)]
    pub remove_role: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DeleteApiKeyVars")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyDeleteMutation {
    pub api_key: ApiKeyDeleteNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ApiKeyMutations",
    variables = "DeleteApiKeyVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyDeleteNs {
    #[arguments(input: $input)]
    pub delete: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "UpdateApiKeyVars")]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyUpdateMutation {
    pub api_key: ApiKeyUpdateNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "ApiKeyMutations",
    variables = "UpdateApiKeyVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyUpdateNs {
    #[arguments(input: $input)]
    pub update: ApiKey,
}

// --- rclone namespace ---------------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "CreateRCloneRemoteVars")]
#[serde(rename_all = "camelCase")]
pub struct RcloneCreateRemoteMutation {
    pub rclone: RcloneCreateRemoteNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "RCloneMutations",
    variables = "CreateRCloneRemoteVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct RcloneCreateRemoteNs {
    #[arguments(input: $input)]
    pub create_r_clone_remote: RCloneRemoteRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "DeleteRCloneRemoteVars")]
#[serde(rename_all = "camelCase")]
pub struct RcloneDeleteRemoteMutation {
    pub rclone: RcloneDeleteRemoteNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "RCloneMutations",
    variables = "DeleteRCloneRemoteVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct RcloneDeleteRemoteNs {
    #[arguments(input: $input)]
    pub delete_r_clone_remote: bool,
}

// --- unraidPlugins namespace --------------------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "InstallPluginVars")]
#[serde(rename_all = "camelCase")]
pub struct UnraidPluginsInstallPluginMutation {
    pub unraid_plugins: UnraidPluginsInstallPluginNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "UnraidPluginsMutations",
    variables = "InstallPluginVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UnraidPluginsInstallPluginNs {
    #[arguments(input: $input)]
    pub install_plugin: PluginInstallOperation,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "InstallPluginVars")]
#[serde(rename_all = "camelCase")]
pub struct UnraidPluginsInstallLanguageMutation {
    pub unraid_plugins: UnraidPluginsInstallLanguageNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "UnraidPluginsMutations",
    variables = "InstallPluginVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UnraidPluginsInstallLanguageNs {
    #[arguments(input: $input)]
    pub install_language: PluginInstallOperation,
}

// --- onboarding namespace (no-arg ops) ----------------------------------------

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCompleteMutation {
    pub onboarding: OnboardingCompleteNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCompleteNs {
    pub complete_onboarding: OnboardingRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingResetMutation {
    pub onboarding: OnboardingResetNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingResetNs {
    pub reset_onboarding: OnboardingRef,
}

// ── mutations: direct (system / connect / notifications) ──

// UPS config enums (configureUps batch).

// Temperature unit (updateTemperatureConfig batch).

// ── configureUps ──────────────────────────────────────────────────────────────
// SDL fields are camelCase → cynic default mapping is correct.
#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
pub struct UPSConfigInput {
    pub service: Option<UpsServiceState>,
    pub ups_cable: Option<UpsCableType>,
    pub custom_ups_cable: Option<String>,
    pub ups_type: Option<UpsType>,
    pub device: Option<String>,
    pub override_ups_capacity: Option<i32>,
    pub battery_level: Option<i32>,
    pub minutes: Option<i32>,
    pub timeout: Option<i32>,
    pub kill_ups: Option<UpsKillPower>,
}

// ── updateSystemTime ──────────────────────────────────────────────────────────
// SDL fields camelCase → default mapping.
#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
pub struct UpdateSystemTimeInput {
    pub time_zone: Option<String>,
    pub use_ntp: Option<bool>,
    pub ntp_servers: Option<Vec<String>>, // [String!]
    pub manual_date_time: Option<String>,
}

// ── updateTemperatureConfig ───────────────────────────────────────────────────
// SDL fields are snake_case → must override mapping.
#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "snake_case")]
pub struct TemperatureConfigInput {
    pub enabled: Option<bool>,
    pub polling_interval: Option<i32>,
    pub default_unit: Option<TemperatureUnit>,
    pub sensors: Option<TemperatureSensorsConfigInput>,
    pub thresholds: Option<TemperatureThresholdsConfigInput>,
    pub history: Option<TemperatureHistoryConfigInput>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "snake_case")]
pub struct TemperatureSensorsConfigInput {
    pub lm_sensors: Option<LmSensorsConfigInput>,
    pub smartctl: Option<SensorConfigInput>,
    pub ipmi: Option<IpmiConfigInput>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "snake_case")]
pub struct LmSensorsConfigInput {
    pub enabled: Option<bool>,
    pub config_path: Option<String>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
pub struct SensorConfigInput {
    pub enabled: Option<bool>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "snake_case")]
pub struct IpmiConfigInput {
    pub enabled: Option<bool>,
    pub args: Option<Vec<String>>, // [String!]
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "snake_case")]
pub struct TemperatureThresholdsConfigInput {
    pub cpu_warning: Option<i32>,
    pub cpu_critical: Option<i32>,
    pub disk_warning: Option<i32>,
    pub disk_critical: Option<i32>,
    pub warning: Option<i32>,
    pub critical: Option<i32>,
}

#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
#[cynic(rename_all = "snake_case")]
pub struct TemperatureHistoryConfigInput {
    pub max_readings: Option<i32>,
    pub retention_ms: Option<i32>,
}

// ── addPlugin / removePlugin ──────────────────────────────────────────────────
// SDL has required fields with defaults; required → non-Option.
#[derive(cynic::InputObject, Debug, Clone, serde::Deserialize)]
pub struct PluginManagementInput {
    pub names: Vec<String>, // [String!]!
    pub bundled: bool,      // Boolean! = false
    pub restart: bool,      // Boolean! = true
}

// updateServerIdentity returns Server! — model a minimal selection.
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Server")]
#[serde(rename_all = "camelCase")]
pub struct ServerRef {
    pub id: PrefixedID,
    pub name: String,
    pub status: ServerStatus,
}

#[derive(cynic::QueryVariables)]
pub struct NotificationIdsVars {
    // shared with unarchive_notifications
    pub ids: Vec<PrefixedID>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "NotificationIdsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveNotificationsMutation {
    #[arguments(ids: $ids)]
    pub archive_notifications: NotificationOverview,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "NotificationIdsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UnarchiveNotificationsMutation {
    #[arguments(ids: $ids)]
    pub unarchive_notifications: NotificationOverview,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "PrefixedIdVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UnreadNotificationMutation {
    #[arguments(id: $id)]
    pub unread_notification: Notification,
}

#[derive(cynic::QueryVariables)]
pub struct NotificationImportanceVars {
    // shared with unarchive_all
    pub importance: Option<NotificationImportance>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "NotificationImportanceVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveAllMutation {
    #[arguments(importance: $importance)]
    pub archive_all: NotificationOverview,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "NotificationImportanceVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UnarchiveAllMutation {
    #[arguments(importance: $importance)]
    pub unarchive_all: NotificationOverview,
}

#[derive(cynic::QueryVariables)]
pub struct UpdateServerIdentityVars {
    pub name: String,
    pub comment: Option<String>,
    pub sys_model: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateServerIdentityVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpdateServerIdentityMutation {
    #[arguments(name: $name, comment: $comment, sysModel: $sys_model)]
    pub update_server_identity: ServerRef,
}

#[derive(cynic::QueryVariables)]
pub struct ConfigureUpsVars {
    pub config: UPSConfigInput,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "ConfigureUpsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ConfigureUpsMutation {
    #[arguments(config: $config)]
    pub configure_ups: bool,
}

#[derive(cynic::QueryVariables)]
pub struct UpdateSystemTimeVars {
    pub input: UpdateSystemTimeInput,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateSystemTimeVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSystemTimeMutation {
    #[arguments(input: $input)]
    pub update_system_time: SystemTime,
}

#[derive(cynic::QueryVariables)]
pub struct UpdateTemperatureConfigVars {
    pub input: TemperatureConfigInput,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateTemperatureConfigVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTemperatureConfigMutation {
    #[arguments(input: $input)]
    pub update_temperature_config: bool,
}

#[derive(cynic::QueryVariables)]
pub struct PluginManagementVars {
    // shared with remove_plugin
    pub input: PluginManagementInput,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "PluginManagementVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct AddPluginMutation {
    #[arguments(input: $input)]
    pub add_plugin: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "PluginManagementVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct RemovePluginMutation {
    #[arguments(input: $input)]
    pub remove_plugin: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ConnectSignOutMutation {
    pub connect_sign_out: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "ConnectSignInVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct ConnectSignInMutation {
    #[arguments(input: $input)]
    pub connect_sign_in: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "SetupRemoteAccessVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct SetupRemoteAccessMutation {
    #[arguments(input: $input)]
    pub setup_remote_access: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "EnableDynamicRemoteAccessVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct EnableDynamicRemoteAccessMutation {
    #[arguments(input: $input)]
    pub enable_dynamic_remote_access: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateApiSettingsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpdateApiSettingsMutation {
    #[arguments(input: $input)]
    pub update_api_settings: ConnectSettingsValuesRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateSettingsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingsMutation {
    #[arguments(input: $input)]
    pub update_settings: UpdateSettingsResponseRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateSshSettingsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSshSettingsMutation {
    #[arguments(input: $input)]
    pub update_ssh_settings: VarsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "InitiateFlashBackupVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct InitiateFlashBackupMutation {
    #[arguments(input: $input)]
    pub initiate_flash_backup: FlashBackupStatusRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "NotifyIfUniqueVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct NotifyIfUniqueMutation {
    #[arguments(input: $input)]
    pub notify_if_unique: Option<Notification>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RefreshDockerDigestsMutation {
    pub refresh_docker_digests: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ResetDockerTemplateMappingsMutation {
    pub reset_docker_template_mappings: bool,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct SyncDockerTemplatePathsMutation {
    pub sync_docker_template_paths: DockerTemplateSyncResultRef,
}

// ── mutations: docker Organizer (folder-based container grouping) ─────────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "CreateDockerFolderVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct CreateDockerFolderMutation {
    #[arguments(name: $name, parentId: $parent_id, childrenIds: $children_ids)]
    pub create_docker_folder: ResolvedOrganizerV1Ref,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "CreateDockerFolderWithItemsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct CreateDockerFolderWithItemsMutation {
    #[arguments(
        name: $name,
        parentId: $parent_id,
        sourceEntryIds: $source_entry_ids,
        position: $position
    )]
    pub create_docker_folder_with_items: ResolvedOrganizerV1Ref,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "SetDockerFolderChildrenVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct SetDockerFolderChildrenMutation {
    #[arguments(folderId: $folder_id, childrenIds: $children_ids)]
    pub set_docker_folder_children: ResolvedOrganizerV1Ref,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "DeleteDockerEntriesVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDockerEntriesMutation {
    #[arguments(entryIds: $entry_ids)]
    pub delete_docker_entries: ResolvedOrganizerV1Ref,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "MoveDockerEntriesToFolderVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct MoveDockerEntriesToFolderMutation {
    #[arguments(sourceEntryIds: $source_entry_ids, destinationFolderId: $destination_folder_id)]
    pub move_docker_entries_to_folder: ResolvedOrganizerV1Ref,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "MoveDockerItemsToPositionVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct MoveDockerItemsToPositionMutation {
    #[arguments(
        sourceEntryIds: $source_entry_ids,
        destinationFolderId: $destination_folder_id,
        position: $position
    )]
    pub move_docker_items_to_position: ResolvedOrganizerV1Ref,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "RenameDockerFolderVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct RenameDockerFolderMutation {
    #[arguments(folderId: $folder_id, newName: $new_name)]
    pub rename_docker_folder: ResolvedOrganizerV1Ref,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateDockerViewPreferencesVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDockerViewPreferencesMutation {
    #[arguments(viewId: $view_id, prefs: $prefs)]
    pub update_docker_view_preferences: ResolvedOrganizerV1Ref,
}

// ── mutations: docker namespace — updateAutostartConfiguration ────────────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "UpdateAutostartConfigurationVars"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateAutostartConfigurationMutation {
    pub docker: DockerUpdateAutostartConfigurationNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "DockerMutations",
    variables = "UpdateAutostartConfigurationVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerUpdateAutostartConfigurationNs {
    #[arguments(entries: $entries, persistUserPreferences: $persist_user_preferences)]
    pub update_autostart_configuration: bool,
}

// ── mutations: customization namespace ─────────────────────────────────────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "SetLocaleVars")]
#[serde(rename_all = "camelCase")]
pub struct CustomizationSetLocaleMutation {
    pub customization: CustomizationSetLocaleNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "CustomizationMutations",
    variables = "SetLocaleVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct CustomizationSetLocaleNs {
    #[arguments(locale: $locale)]
    pub set_locale: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation", variables = "SetThemeVars")]
#[serde(rename_all = "camelCase")]
pub struct CustomizationSetThemeMutation {
    pub customization: CustomizationSetThemeNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "CustomizationMutations",
    variables = "SetThemeVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct CustomizationSetThemeNs {
    #[arguments(theme: $theme)]
    pub set_theme: Theme,
}

// ── mutations: onboarding namespace — remaining lifecycle ops ──────────────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingBypassMutation {
    pub onboarding: OnboardingBypassNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingBypassNs {
    pub bypass_onboarding: OnboardingRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingClearOverrideMutation {
    pub onboarding: OnboardingClearOverrideNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingClearOverrideNs {
    pub clear_onboarding_override: OnboardingRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCloseMutation {
    pub onboarding: OnboardingCloseNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCloseNs {
    pub close_onboarding: OnboardingRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingOpenMutation {
    pub onboarding: OnboardingOpenNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingOpenNs {
    pub open_onboarding: OnboardingRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingResumeMutation {
    pub onboarding: OnboardingResumeNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingResumeNs {
    pub resume_onboarding: OnboardingRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Mutation")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingRefreshInternalBootContextMutation {
    pub onboarding: OnboardingRefreshInternalBootContextNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "OnboardingMutations", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct OnboardingRefreshInternalBootContextNs {
    pub refresh_internal_boot_context: OnboardingInternalBootContextRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "SetOnboardingOverrideVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingSetOverrideMutation {
    pub onboarding: OnboardingSetOverrideNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "OnboardingMutations",
    variables = "SetOnboardingOverrideVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingSetOverrideNs {
    #[arguments(input: $input)]
    pub set_onboarding_override: OnboardingRef,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Mutation",
    variables = "CreateInternalBootPoolVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCreateInternalBootPoolMutation {
    pub onboarding: OnboardingCreateInternalBootPoolNs,
}
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "OnboardingMutations",
    variables = "CreateInternalBootPoolVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCreateInternalBootPoolNs {
    #[arguments(input: $input)]
    pub create_internal_boot_pool: OnboardingInternalBootResultRef,
}

// ── query: previewEffectivePermissions ─────────────────────────────────────────

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "PreviewEffectivePermissionsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct PreviewEffectivePermissionsQuery {
    #[arguments(roles: $roles, permissions: $permissions)]
    pub preview_effective_permissions: Vec<Permission>,
}

// UPS config enums (configureUps batch) — hand-written for graphql_type (SDL uses UPS*).
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(graphql_type = "UPSServiceState")]
pub enum UpsServiceState {
    Enable,
    Disable,
}
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(graphql_type = "UPSCableType")]
pub enum UpsCableType {
    Usb,
    Simple,
    Smart,
    Ether,
    Custom,
}
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[allow(clippy::enum_variant_names)]
#[cynic(graphql_type = "UPSType")]
pub enum UpsType {
    Usb,
    Apcsmart,
    Net,
    Snmp,
    Dumb,
    Pcnet,
    Modbus,
}
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(graphql_type = "UPSKillPower")]
pub enum UpsKillPower {
    Yes,
    No,
}

// ── original read queries migrated to cynic ──

// from orig_disks
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct DisksReadQuery {
    pub disks: Vec<DiskRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Disk", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DiskRead {
    pub id: PrefixedID,
    pub device: String,
    #[cynic(rename = "type")]
    pub r#type: String,
    pub name: String,
    pub vendor: String,
    pub size: f64, // SDL Float! → number (NOT BigInt)
    pub serial_num: String,
    pub interface_type: DiskInterfaceType,
    pub smart_status: DiskSmartStatus,
    pub temperature: Option<f64>, // SDL Float (nullable)
    pub is_spinning: bool,
    pub partitions: Vec<DiskPartitionRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DiskPartition", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DiskPartitionRead {
    pub name: String,
    pub fs_type: DiskFsType,
    pub size: f64, // SDL Float! → number
}

// from orig_disks
// ── new scalar (add with BigInt/PrefixedID/DateTime/Json) ────────────────────
/// SDL `Port` — a 0..65535 int; delivered/emitted as a JSON number.
#[derive(cynic::Scalar, Clone, Debug)]
pub struct Port(pub i32);

// ── new enum (add near the other gql_enum! calls) ────────────────────────────

// ── docker ───────────────────────────────────────────────────────────────────
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct DockerReadQuery {
    pub docker: DockerRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Docker", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DockerRead {
    pub containers: Vec<DockerReadContainer>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DockerContainer", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DockerReadContainer {
    pub id: PrefixedID,
    pub names: Vec<String>,
    pub image: String,
    pub state: ContainerState,
    pub status: String,
    pub auto_start: bool,                  // autoStart: Boolean!
    pub auto_start_order: Option<i32>,     // autoStartOrder: Int (nullable)
    pub ports: Vec<ContainerPortRead>,     // ports: [ContainerPort!]!
    pub web_ui_url: Option<String>,        // webUiUrl: String
    pub icon_url: Option<String>,          // iconUrl: String
    pub is_orphaned: bool,                 // isOrphaned: Boolean!
    pub is_update_available: Option<bool>, // isUpdateAvailable: Boolean (nullable)
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ContainerPort", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ContainerPortRead {
    pub private_port: Option<Port>, // privatePort: Port (nullable)
    pub public_port: Option<Port>,  // publicPort: Port (nullable)
    #[cynic(rename = "type")]
    pub r#type: ContainerPortType, // type: ContainerPortType!
    pub ip: Option<String>,         // ip: String (nullable)
}

// from orig_disks
#[derive(cynic::QueryVariables)]
pub struct DockerLogsVars {
    pub id: PrefixedID,
    pub tail: Option<i32>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", variables = "DockerLogsVars")]
#[serde(rename_all = "camelCase")]
pub struct DockerLogsReadQuery {
    pub docker: DockerLogsNs,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Docker",
    variables = "DockerLogsVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct DockerLogsNs {
    #[arguments(id: $id, tail: $tail)]
    pub logs: DockerContainerLogsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DockerContainerLogs", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DockerContainerLogsRead {
    pub container_id: PrefixedID, // containerId: PrefixedID!
    pub lines: Vec<DockerContainerLogLineRead>,
    pub cursor: Option<DateTime>, // cursor: DateTime (nullable)
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DockerContainerLogLine", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DockerContainerLogLineRead {
    pub timestamp: DateTime, // timestamp: DateTime!
    pub message: String,
}

// from orig_disks
// ── new enum (add near the other gql_enum! calls) ────────────────────────────

// ── vms ───────────────────────────────────────────────────────────────────────
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct VmsReadQuery {
    pub vms: VmsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Vms", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct VmsRead {
    pub domains: Option<Vec<VmDomainRead>>, // SDL [VmDomain!] (list nullable)
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "VmDomain", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct VmDomainRead {
    pub id: PrefixedID,
    pub name: Option<String>, // SDL name: String (nullable)
    pub state: VmState,       // SDL state: VmState!
}

// from orig_server
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct ServerReadQuery {
    pub server: Option<ServerRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Server")]
#[serde(rename_all = "camelCase")]
pub struct ServerRead {
    pub id: PrefixedID,
    pub name: String,
    pub comment: Option<String>,
    pub status: ServerStatus,
    pub wanip: String,
    pub lanip: String,
    pub localurl: String,
    pub remoteurl: String,
    pub guid: String,
}

// from orig_server
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct InfoReadQuery {
    pub info: InfoRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Info")]
#[serde(rename_all = "camelCase")]
pub struct InfoRead {
    pub time: DateTime,
    pub os: InfoOsRead,
    pub cpu: InfoCpuRead,
    pub memory: InfoMemoryRead,
    pub versions: InfoVersionsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "InfoOs")]
#[serde(rename_all = "camelCase")]
pub struct InfoOsRead {
    pub platform: Option<String>,
    pub distro: Option<String>,
    pub release: Option<String>,
    pub kernel: Option<String>,
    pub arch: Option<String>,
    pub hostname: Option<String>,
    pub fqdn: Option<String>,
    pub uptime: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "InfoCpu")]
#[serde(rename_all = "camelCase")]
pub struct InfoCpuRead {
    pub brand: Option<String>,
    pub manufacturer: Option<String>,
    pub cores: Option<i32>,
    pub threads: Option<i32>,
    pub speed: Option<f64>,
    pub speedmax: Option<f64>,
    pub socket: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "InfoMemory")]
#[serde(rename_all = "camelCase")]
pub struct InfoMemoryRead {
    pub layout: Vec<MemoryLayoutRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "MemoryLayout", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MemoryLayoutRead {
    pub size: BigInt,
    #[cynic(rename = "type")]
    pub r#type: Option<String>,
    pub clock_speed: Option<i32>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "InfoVersions")]
#[serde(rename_all = "camelCase")]
pub struct InfoVersionsRead {
    pub core: CoreVersionsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "CoreVersions")]
#[serde(rename_all = "camelCase")]
pub struct CoreVersionsRead {
    pub unraid: Option<String>,
    pub kernel: Option<String>,
}

// from orig_server
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct VarsReadQuery {
    pub vars: VarsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Vars", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct VarsRead {
    pub version: Option<String>,
    pub name: Option<String>,
    pub time_zone: Option<String>,
    pub comment: Option<String>,
    pub sys_model: Option<String>,
    pub use_ssl: Option<bool>,
    pub port: Option<i32>,
    pub portssl: Option<i32>,
    pub use_ssh: Option<bool>,
    pub portssh: Option<i32>,
    pub use_telnet: Option<bool>,
    pub porttelnet: Option<i32>,
    pub start_array: Option<bool>,
    pub spindown_delay: Option<String>,
    pub share_smb_enabled: Option<bool>,
    pub share_nfs_enabled: Option<bool>,
    pub share_afp_enabled: Option<bool>,
    pub config_valid: Option<bool>,
    pub config_error: Option<ConfigErrorState>,
    pub reg_state: Option<RegistrationState>,
    pub reg_to: Option<String>,
    pub device_count: Option<i32>,
    pub flash_guid: Option<String>,
    pub flash_product: Option<String>,
    pub flash_vendor: Option<String>,
    pub sb_name: Option<String>,
    pub sb_version: Option<String>,
    pub sb_updated: Option<String>,
    pub sb_state: Option<String>,
}

// from orig_server
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct RegistrationReadQuery {
    pub registration: Option<RegistrationRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Registration", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RegistrationRead {
    pub id: PrefixedID,
    #[cynic(rename = "type")]
    pub r#type: Option<RegistrationType>,
    pub state: Option<RegistrationState>,
    pub expiration: Option<String>,
    pub update_expiration: Option<String>,
}

// from orig_server
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RemoteAccessReadQuery {
    pub remote_access: RemoteAccessRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "RemoteAccess", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RemoteAccessRead {
    pub access_type: WanAccessType,
    pub forward_type: Option<WanForwardType>,
    pub port: Option<i32>,
}

// from orig_server
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct ConnectReadQuery {
    pub connect: ConnectRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Connect", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ConnectRead {
    pub id: PrefixedID,
    pub dynamic_remote_access: DynamicRemoteAccessStatusRead,
    pub settings: ConnectSettingsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "DynamicRemoteAccessStatus", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct DynamicRemoteAccessStatusRead {
    pub enabled_type: DynamicRemoteAccessType,
    pub running_type: DynamicRemoteAccessType,
    pub error: Option<String>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ConnectSettings")]
#[serde(rename_all = "camelCase")]
pub struct ConnectSettingsRead {
    pub values: ConnectSettingsValuesRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ConnectSettingsValues", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ConnectSettingsValuesRead {
    pub access_type: WanAccessType,
    pub forward_type: Option<WanForwardType>,
    pub port: Option<i32>,
}

// from orig_server
// vars.configError — SDL enum ConfigErrorState

// vars.regState + registration.state — SDL enum RegistrationState

// remoteAccess.accessType + connect…values.accessType — SDL enum WAN_ACCESS_TYPE

// remoteAccess.forwardType + connect…values.forwardType — SDL enum WAN_FORWARD_TYPE

// connect.dynamicRemoteAccess.{enabled,running}Type — SDL enum DynamicRemoteAccessType

// registration.type — SDL type name is `registrationType` (lowercase),
// so the macro can't be used; hand-write with a graphql_type override.
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(graphql_type = "registrationType")]
#[allow(clippy::enum_variant_names)]
pub enum RegistrationType {
    Basic,     // BASIC
    Plus,      // PLUS
    Pro,       // PRO
    Starter,   // STARTER
    Unleashed, // UNLEASHED
    Lifetime,  // LIFETIME
    Invalid,   // INVALID
    Trial,     // TRIAL
}

// from orig_shares
// URL_TYPE — SDL SCREAMING values; round-trip to identical JSON strings
// (e.g. "LAN", "WIREGUARD"). The `network` read selects accessUrls[].type.

// from orig_shares
/// `URL_TYPE` SDL enum — values are SCREAMING_SNAKE, so the cynic derive needs the
/// explicit `graphql_type` and the variant names already match the SDL spelling.
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(graphql_type = "URL_TYPE")]
#[allow(clippy::enum_variant_names)]
pub enum UrlType {
    #[cynic(rename = "LAN")]
    Lan,
    #[cynic(rename = "WIREGUARD")]
    Wireguard,
    #[cynic(rename = "WAN")]
    Wan,
    #[cynic(rename = "MDNS")]
    Mdns,
    #[cynic(rename = "OTHER")]
    Other,
    #[cynic(rename = "DEFAULT")]
    Default,
}

// from orig_shares
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct SharesQuery {
    pub shares: Vec<ShareRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Share", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ShareRead {
    pub id: PrefixedID,
    pub name: Option<String>,
    pub free: Option<BigInt>,
    pub used: Option<BigInt>,
    pub size: Option<BigInt>,
    pub cache: Option<bool>,
    pub comment: Option<String>,
    pub allocator: Option<String>,
    pub luks_status: Option<String>,
}

// from orig_shares
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct NotificationsQuery {
    pub notifications: NotificationsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Notifications", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct NotificationsRead {
    pub overview: NotificationOverviewRead,
    pub warnings_and_alerts: Vec<NotificationRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "NotificationOverview", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct NotificationOverviewRead {
    pub unread: NotificationCountsRead,
    pub archive: NotificationCountsRead,
}

// field order matches the hand query: warning alert info total
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "NotificationCounts")]
pub struct NotificationCountsRead {
    pub warning: i32,
    pub alert: i32,
    pub info: i32,
    pub total: i32,
}

// Read-side selection of Notification: NO formattedTimestamp/link/type-after-importance
// reorder — matches `id title subject description importance type timestamp`.
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Notification", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct NotificationRead {
    pub id: PrefixedID,
    pub title: String,
    pub subject: String,
    pub description: String,
    pub importance: NotificationImportance,
    #[cynic(rename = "type")]
    pub r#type: NotificationType,
    pub timestamp: Option<String>,
}

// from orig_shares
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct LogFilesQuery {
    pub log_files: Vec<LogFileRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "LogFile", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct LogFileRead {
    pub name: String,
    pub path: String,
    pub size: i32, // Int! — a JSON number, not a BigInt string
    pub modified_at: DateTime,
}

// from orig_shares
#[derive(cynic::QueryVariables)]
pub struct LogFileVars {
    pub path: String,
    pub lines: Option<i32>,
    pub start_line: Option<i32>, // serialized as $startLine via #[arguments] below
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(
    graphql_type = "Query",
    variables = "LogFileVars",
    rename_all = "camelCase"
)]
#[serde(rename_all = "camelCase")]
pub struct LogFileQuery {
    #[arguments(path: $path, lines: $lines, startLine: $start_line)]
    pub log_file: LogFileContentRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "LogFileContent", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct LogFileContentRead {
    pub path: String,
    pub content: String,
    pub total_lines: i32,
    pub start_line: Option<i32>, // SDL: startLine: Int (nullable)
}

// from orig_shares
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct ServicesQuery {
    pub services: Vec<ServiceRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Service", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ServiceRead {
    pub id: PrefixedID,
    pub name: Option<String>,
    pub online: Option<bool>,
    pub version: Option<String>,
    pub uptime: Option<UptimeRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Uptime")]
#[serde(rename_all = "camelCase")]
pub struct UptimeRead {
    pub timestamp: Option<String>,
}

// from orig_shares
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct NetworkQuery {
    pub network: NetworkRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Network", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct NetworkRead {
    pub id: PrefixedID,
    pub access_urls: Option<Vec<AccessUrlRead>>, // SDL: [AccessUrl!] (nullable list)
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "AccessUrl", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct AccessUrlRead {
    #[cynic(rename = "type")]
    pub r#type: UrlType, // URL_TYPE! enum; serializes to "LAN"/"WIREGUARD"/…
    pub name: Option<String>,
    pub ipv4: Option<Url>,
    pub ipv6: Option<Url>,
}

// from orig_shares
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query")]
#[serde(rename_all = "camelCase")]
pub struct PluginsQuery {
    pub plugins: Vec<PluginRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Plugin", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct PluginRead {
    pub name: String,
    pub version: String,
    pub has_api_module: Option<bool>,
    pub has_cli_module: Option<bool>,
}

// from orig_ups
// ── ups (read) ────────────────────────────────────────────────────────────────
// Reuses existing UpsDevice/UpsBattery/UpsPower (defined for ups_device_by_id).
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UpsQuery {
    pub ups_devices: Vec<UpsDevice>,
}

// from orig_ups
// ── ups_config (read) ─────────────────────────────────────────────────────────
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UpsConfigQuery {
    pub ups_configuration: UpsConfigRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "UPSConfiguration", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct UpsConfigRead {
    pub service: Option<String>,
    pub ups_cable: Option<String>,
    pub ups_type: Option<String>,
    pub device: Option<String>,
    pub battery_level: Option<i32>,
    pub minutes: Option<i32>,
    pub timeout: Option<i32>,
    pub kill_ups: Option<String>,
    pub nis_ip: Option<String>,
    pub net_server: Option<String>,
    pub ups_name: Option<String>,
    pub model_name: Option<String>,
}

// from orig_ups
// ── new enum (add near the other gql_enum! calls) ─────────────────────────────
// NOTE: gql_enum! uses cynic's default SCREAMING_SNAKE_CASE mapping, which maps
// `CpuPackage` -> `CPU_PACKAGE`, etc. — matching the SDL `enum SensorType` values.

// ── metrics (read) ────────────────────────────────────────────────────────────
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsQuery {
    pub metrics: MetricsRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Metrics", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsRead {
    pub cpu: Option<MetricsCpu>,
    pub memory: Option<MetricsMemory>,
    pub temperature: Option<MetricsTemperature>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "CpuUtilization", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsCpu {
    pub percent_total: f64,
    pub cpus: Vec<MetricsCpuLoad>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "CpuLoad", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsCpuLoad {
    pub percent_total: f64,
    pub percent_user: f64,
    pub percent_system: f64,
    pub percent_idle: f64,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "MemoryUtilization", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsMemory {
    pub total: BigInt,
    pub used: BigInt,
    pub free: BigInt,
    pub available: BigInt,
    pub percent_total: f64,
    pub swap_total: BigInt,
    pub swap_used: BigInt,
    pub swap_free: BigInt,
    pub percent_swap_total: f64,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "TemperatureMetrics", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsTemperature {
    pub sensors: Vec<MetricsSensor>,
    pub summary: MetricsTempSummary,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "TemperatureSensor", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsSensor {
    pub id: PrefixedID,
    pub name: String,
    #[cynic(rename = "type")]
    pub r#type: SensorType,
    pub location: Option<String>,
    pub current: MetricsReading,
    pub warning: Option<f64>,
    pub critical: Option<f64>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "TemperatureReading", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsReading {
    pub value: f64,
    pub unit: TemperatureUnit,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "TemperatureSummary", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct MetricsTempSummary {
    pub average: f64,
    pub warning_count: i32,
    pub critical_count: i32,
}

// from orig_ups
// ── parity_history (read) ─────────────────────────────────────────────────────
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityHistoryQuery {
    pub parity_history: Vec<ParityHistoryRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "ParityCheck", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct ParityHistoryRead {
    pub date: Option<DateTime>,
    pub duration: Option<i32>,
    pub speed: Option<String>,
    pub status: ParityCheckStatus,
    pub errors: Option<i32>,
    pub progress: Option<i32>,
    pub correcting: Option<bool>,
    pub paused: Option<bool>,
    pub running: Option<bool>,
}

// from orig_ups
// ── rclone (read) ─────────────────────────────────────────────────────────────
#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "Query", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RcloneQuery {
    pub rclone: RcloneRead,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "RCloneBackupSettings", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RcloneRead {
    pub remotes: Vec<RcloneRemoteRead>,
    pub drives: Vec<RcloneDriveRead>,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "RCloneRemote", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RcloneRemoteRead {
    pub name: String,
    #[cynic(rename = "type")]
    pub r#type: String,
}

#[derive(cynic::QueryFragment, serde::Serialize)]
#[cynic(graphql_type = "RCloneDrive", rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
pub struct RcloneDriveRead {
    pub name: String,
}

// ── enums (cynic checks them vs the SDL; serde does the JSON round-trip) ──────

macro_rules! gql_enum {
    ($name:ident { $($variant:ident),+ $(,)? }) => {
        // Variant names mirror the SDL's enum values (e.g. `DISK_*`), so the
        // shared-prefix lint is a false positive here.
        #[derive(cynic::Enum, Clone, Copy, Debug)]
        #[allow(clippy::enum_variant_names)]
        pub enum $name { $($variant),+ }
    };
}

gql_enum!(ArrayState {
    Started,
    Stopped,
    NewArray,
    ReconDisk,
    DisableDisk,
    SwapDsbl,
    InvalidExpansion,
    ParityNotBiggest,
    TooManyMissingDisks,
    NewDiskTooSmall,
    NoDataDisks,
});
gql_enum!(ParityCheckStatus {
    NeverRun,
    Running,
    Paused,
    Completed,
    Cancelled,
    Failed
});
gql_enum!(ArrayDiskStatus {
    DiskNp,
    DiskOk,
    DiskNpMissing,
    DiskInvalid,
    DiskWrong,
    DiskDsbl,
    DiskNpDsbl,
    DiskDsblNew,
    DiskNew,
});
gql_enum!(ArrayDiskType {
    Data,
    Parity,
    Boot,
    Flash,
    Cache
});
gql_enum!(ArrayDiskFsColor {
    GreenOn,
    GreenBlink,
    BlueOn,
    BlueBlink,
    YellowOn,
    YellowBlink,
    RedOn,
    RedOff,
    GreyOff,
});

// OIDC authorization-rule enums (oidc batch).
gql_enum!(AuthorizationOperator {
    Equals,
    Contains,
    EndsWith,
    StartsWith,
});
gql_enum!(AuthorizationRuleMode { Or, And });

// Auth enums (auth batch).
gql_enum!(Role {
    Admin,
    Connect,
    Guest,
    Viewer
});
gql_enum!(AuthAction {
    CreateAny,
    CreateOwn,
    ReadAny,
    ReadOwn,
    UpdateAny,
    UpdateOwn,
    DeleteAny,
    DeleteOwn,
});

// Config/onboarding enums (config batch).
gql_enum!(OnboardingStatus {
    Incomplete,
    Upgrade,
    Downgrade,
    Completed
});
gql_enum!(Temperature {
    Celsius,
    Fahrenheit
});

// Misc-batch enums (Role + ThemeName already defined above; not redefined).
gql_enum!(ServerStatus {
    Online,
    Offline,
    NeverConnected
});
gql_enum!(DiskInterfaceType {
    Sas,
    Sata,
    Usb,
    Pcie,
    Unknown
});
gql_enum!(DiskSmartStatus { Ok, Unknown });
gql_enum!(DiskFsType {
    Xfs,
    Btrfs,
    Vfat,
    Zfs,
    Ext4,
    Ntfs
});
gql_enum!(PluginInstallStatus {
    Failed,
    Queued,
    Running,
    Succeeded
});
gql_enum!(MinigraphStatus {
    PreInit,
    Connecting,
    Connected,
    PingFailure,
    ErrorRetrying
});

// Notification enums (mutation batch).
gql_enum!(NotificationImportance {
    Alert,
    Info,
    Warning
});
gql_enum!(NotificationType { Unread, Archive });

// Docker mutation enum (docker mutation batch).
gql_enum!(ContainerState {
    Running,
    Paused,
    Exited
});

// Array input enum (array mutation batch).
gql_enum!(ArrayStateInputState { Start, Stop });

// Direct-mutation enums (UPS config + temperature unit).
gql_enum!(TemperatureUnit {
    Celsius,
    Fahrenheit,
    Kelvin,
    Rankine
});

// Original-read enums.
gql_enum!(ContainerPortType { Tcp, Udp });
gql_enum!(VmState {
    Nostate,
    Running,
    Idle,
    Paused,
    Shutdown,
    Shutoff,
    Crashed,
    Pmsuspended
});
gql_enum!(ConfigErrorState {
    UnknownError, // UNKNOWN_ERROR
    Ineligible,   // INELIGIBLE
    Invalid,      // INVALID
    NoKeyServer,  // NO_KEY_SERVER
    Withdrawn,    // WITHDRAWN
});
gql_enum!(RegistrationState {
    Trial,
    Basic,
    Plus,
    Pro,
    Starter,
    Unleashed,
    Lifetime,
    Eexpired,
    Eguid,
    Eguid1,
    Etrial,
    Enokeyfile,
    Enokeyfile1,
    Enokeyfile2,
    Enoflash,
    Enoflash1,
    Enoflash2,
    Enoflash3,
    Enoflash4,
    Enoflash5,
    Enoflash6,
    Enoflash7,
    Eblacklisted,
    Eblacklisted1,
    Eblacklisted2,
    Enoconn,
});
gql_enum!(DynamicRemoteAccessType {
    Static,
    Upnp,
    Disabled
});

// SDL type names are SCREAMING (WAN_ACCESS_TYPE / WAN_FORWARD_TYPE / URL_TYPE),
// which the macro can't set — hand-written with graphql_type.
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(graphql_type = "WAN_ACCESS_TYPE")]
pub enum WanAccessType {
    Dynamic,
    Always,
    Disabled,
}
#[derive(cynic::Enum, Clone, Copy, Debug)]
#[cynic(graphql_type = "WAN_FORWARD_TYPE")]
pub enum WanForwardType {
    Upnp,
    Static,
}
gql_enum!(SensorType {
    CpuPackage,  // CPU_PACKAGE
    CpuCore,     // CPU_CORE
    Motherboard, // MOTHERBOARD
    Chipset,     // CHIPSET
    Gpu,         // GPU
    Disk,        // DISK
    Nvme,        // NVME
    Ambient,     // AMBIENT
    Vrm,         // VRM
    Custom,      // CUSTOM
});

#[cfg(test)]
mod tests {
    use super::BigInt;
    use serde_json::json;

    #[test]
    fn bigint_accepts_numeric_json_and_normalizes_to_string() {
        let value: BigInt = serde_json::from_value(json!(44_092_026_880_u64))
            .expect("live Unraid BigInt numbers should deserialize");

        assert_eq!(serde_json::to_value(value).unwrap(), json!("44092026880"));
    }
}
