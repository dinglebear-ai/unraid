use std::time::Duration;

use anyhow::{Context, Result};
use reqwest::Client;
use serde_json::{json, Value};
use thiserror::Error;

use crate::config::UnraidConfig;

/// Typed classification of a failure talking to the upstream Unraid GraphQL API.
///
/// This is the *routing* contract: the dispatch layer downcasts an [`anyhow::Error`]
/// to this enum to decide how to surface the failure to the MCP caller, instead of
/// matching on message prose. Each variant carries only a category-level message —
/// raw upstream bodies / GraphQL `errors` are logged server-side, never embedded
/// here (see `send_graphql`), so they cannot leak to the caller or aid schema
/// probing.
#[derive(Debug, Error)]
pub enum UpstreamError {
    /// Could not reach the upstream (connection refused, DNS, TLS handshake, timeout).
    #[error("{0}")]
    Unreachable(String),
    /// Upstream rejected our credentials (HTTP 401/403).
    #[error("{0}")]
    Auth(String),
    /// Any other upstream-side failure (5xx, GraphQL errors, malformed response).
    #[error("{0}")]
    Other(String),
}

/// Parse an importance string into the typed enum (optional).
fn parse_importance(v: Option<&str>) -> Result<Option<crate::gql_typed::NotificationImportance>> {
    match v {
        None => Ok(None),
        Some(s) => serde_json::from_value(serde_json::json!(s))
            .map(Some)
            .map_err(|e| UpstreamError::Other(format!("invalid importance `{s}`: {e}")).into()),
    }
}

/// Parse role-name strings into the typed `Role` enum list (GraphQL SCREAMING_SNAKE).
fn parse_role(role: &str) -> Result<crate::gql_typed::Role> {
    serde_json::from_value(serde_json::json!(role))
        .map_err(|e| UpstreamError::Other(format!("invalid role `{role}`: {e}")).into())
}

fn parse_roles(roles: Option<&[String]>) -> Result<Option<Vec<crate::gql_typed::Role>>> {
    match roles {
        None => Ok(None),
        Some(r) => serde_json::from_value(serde_json::to_value(r)?)
            .map(Some)
            .map_err(|e| UpstreamError::Other(format!("invalid roles: {e}")).into()),
    }
}

/// Build `AddPermissionInput`s from a JSON array of `{resource, actions}` objects.
fn parse_permissions(v: &Value) -> Result<Option<Vec<crate::gql_typed::AddPermissionInput>>> {
    use crate::gql_typed::AddPermissionInput;
    let Some(arr) = v.as_array() else {
        return Ok(None);
    };
    let mut out = Vec::with_capacity(arr.len());
    for p in arr {
        let resource = serde_json::from_value(p.get("resource").cloned().unwrap_or(Value::Null))
            .map_err(|e| UpstreamError::Other(format!("invalid permission resource: {e}")))?;
        let actions = serde_json::from_value(
            p.get("actions")
                .cloned()
                .unwrap_or_else(|| serde_json::json!([])),
        )
        .map_err(|e| UpstreamError::Other(format!("invalid permission actions: {e}")))?;
        out.push(AddPermissionInput { resource, actions });
    }
    Ok(Some(out))
}

#[derive(Clone)]
pub struct UnraidClient {
    client: Client,
    url: String,
    api_key: String,
}

impl UnraidClient {
    pub fn new(cfg: &UnraidConfig) -> Result<Self> {
        if cfg.api_url.is_empty() {
            anyhow::bail!("UNRAID_API_URL is not set");
        }
        if cfg.api_key.is_empty() {
            anyhow::bail!("UNRAID_API_KEY is not set");
        }
        if cfg.skip_tls_verify {
            tracing::warn!(
                "UNRAID_API_SKIP_TLS_VERIFY is enabled: TLS certificate verification is DISABLED. \
                 The API key is sent to an unverified endpoint and is exposed to on-path (MITM) \
                 attackers. Only use this for self-signed certificates on a trusted network."
            );
        }
        let client = reqwest::ClientBuilder::new()
            .danger_accept_invalid_certs(cfg.skip_tls_verify)
            .connect_timeout(Duration::from_secs(5))
            .build()
            .context("failed to build HTTP client")?;
        Ok(Self {
            client,
            url: cfg.api_url.clone(),
            api_key: cfg.api_key.clone(),
        })
    }

    /// POST an already-assembled GraphQL HTTP body (`{query, variables, …}`),
    /// returning the `data` object. Shared by the string-query path and the typed
    /// (cynic) path so both get identical auth headers, timeout, and the
    /// category-level error mapping that never leaks raw upstream bodies.
    async fn send_graphql(&self, body: Value) -> Result<Value> {
        let span = tracing::info_span!("graphql.query", url = %self.url);
        let _guard = span.enter();

        let resp = match self
            .client
            .post(&self.url)
            .header("x-api-key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .timeout(Duration::from_secs(30))
            .send()
            .await
        {
            Ok(resp) => resp,
            Err(e) => {
                // Transport-level failure: connection refused, DNS, TLS, timeout.
                // The reqwest error text can carry OS-locale-specific wording, so it
                // is logged server-side; the caller gets a stable category message.
                tracing::warn!(error = %e, "GraphQL request failed at the transport layer");
                let category = if e.is_connect() || e.is_timeout() {
                    "upstream unreachable — is UNRAID_API_URL reachable?"
                } else {
                    "upstream request failed before a response was received"
                };
                return Err(UpstreamError::Unreachable(category.to_string()).into());
            }
        };

        let status = resp.status();

        if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
            // Read the body only to log it; never return it to the caller.
            let body = resp.text().await.unwrap_or_default();
            tracing::warn!(status = %status, body = %body, "upstream rejected the request (auth)");
            return Err(UpstreamError::Auth("upstream rejected the request — check that UNRAID_API_KEY is correct and has not expired".to_string()).into());
        }

        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            tracing::error!(status = %status, body = %body, "upstream returned a non-success HTTP status");
            return Err(UpstreamError::Other(format!("upstream returned HTTP {status}")).into());
        }

        let body: Value = match resp.json().await {
            Ok(body) => body,
            Err(e) => {
                tracing::error!(error = %e, "failed to parse GraphQL response as JSON");
                return Err(UpstreamError::Other(
                    "upstream returned an unexpected non-JSON response".to_string(),
                )
                .into());
            }
        };

        if let Some(errors) = body.get("errors") {
            // Log the full GraphQL `errors` array server-side; the caller only learns
            // that a GraphQL-level error occurred (no field names / messages leaked).
            tracing::error!(errors = %errors, "upstream returned GraphQL errors");
            return Err(UpstreamError::Other(
                "upstream GraphQL error — see server logs for details".to_string(),
            )
            .into());
        }

        let data = body.get("data").cloned().ok_or_else(|| {
            tracing::error!(body = %body, "GraphQL response missing 'data' field");
            UpstreamError::Other("upstream GraphQL response missing 'data' field".to_string())
        })?;
        tracing::debug!(status = %status, "GraphQL query ok");
        Ok(data)
    }

    /// Expose the HTTP client and URL for the health probe.
    pub fn raw_client(&self) -> (&Client, &str, &str) {
        (&self.client, &self.url, &self.api_key)
    }

    /// Run a typed cynic operation over the existing transport: serialise the
    /// operation to the GraphQL HTTP body, send it, then deserialise the `data`
    /// back through the cynic type and re-emit it as `Value` (so dispatch /
    /// formatters / MCP are unchanged). cynic checks the query against the SDL at
    /// compile time; this validates the *response* round-trips through that type.
    async fn run_typed<T, V>(&self, op: cynic::Operation<T, V>) -> Result<Value>
    where
        T: serde::Serialize + serde::de::DeserializeOwned + 'static,
        V: serde::Serialize,
    {
        let data = self.send_graphql(serde_json::to_value(&op)?).await?;
        let typed: T = serde_json::from_value(data).map_err(|e| {
            tracing::error!(error = %e, "upstream response did not match the typed schema");
            UpstreamError::Other("upstream response shape did not match the schema".to_string())
        })?;
        Ok(serde_json::to_value(typed)?)
    }

    /// Typed-client spike: `flash` via cynic instead of a hand-written string.
    pub async fn flash_typed(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::FlashQuery::build(()))
            .await
    }

    /// Typed-client spike: `array` via cynic (nesting / lists / BigInt / enums).
    pub async fn array_typed(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ArrayQuery::build(()))
            .await
    }

    pub async fn online(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::OnlineQuery::build(()))
            .await
    }

    pub async fn system_time(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::SystemTimeQuery::build(()))
            .await
    }

    pub async fn installed_unraid_plugins(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::InstalledPluginsQuery::build(()))
            .await
    }

    pub async fn is_sso_enabled(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::IsSsoEnabledQuery::build(()))
            .await
    }

    pub async fn public_oidc_providers(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::PublicOidcProvidersQuery::build(()))
            .await
    }

    pub async fn oidc_providers(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::OidcProvidersQuery::build(()))
            .await
    }

    pub async fn oidc_configuration(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::OidcConfigurationQuery::build(()))
            .await
    }

    pub async fn api_keys(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ApiKeysQuery::build(()))
            .await
    }

    pub async fn api_key_possible_roles(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ApiKeyPossibleRolesQuery::build(()))
            .await
    }

    pub async fn api_key_possible_permissions(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ApiKeyPossiblePermissionsQuery::build(()))
            .await
    }

    pub async fn get_available_auth_actions(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::AvailableAuthActionsQuery::build(()))
            .await
    }

    pub async fn get_api_key_creation_form_schema(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ApiKeyCreationFormSchemaQuery::build(()))
            .await
    }

    pub async fn config(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ConfigQuery::build(()))
            .await
    }

    pub async fn settings(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::SettingsQuery::build(()))
            .await
    }

    pub async fn display(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::DisplayQuery::build(()))
            .await
    }

    pub async fn customization(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::CustomizationQuery::build(()))
            .await
    }

    pub async fn internal_boot_context(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::InternalBootContextQuery::build(()))
            .await
    }

    pub async fn me(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::MeQuery::build(())).await
    }

    pub async fn owner(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::OwnerQuery::build(()))
            .await
    }

    pub async fn servers(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ServersQuery::build(()))
            .await
    }

    pub async fn is_fresh_install(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::IsFreshInstallQuery::build(()))
            .await
    }

    pub async fn public_theme(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::PublicThemeQuery::build(()))
            .await
    }

    pub async fn network_interfaces(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::NetworkInterfacesQuery::build(()))
            .await
    }

    pub async fn time_zone_options(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::TimeZoneOptionsQuery::build(()))
            .await
    }

    pub async fn assignable_disks(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::AssignableDisksQuery::build(()))
            .await
    }

    pub async fn plugin_install_operations(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::PluginInstallOperationsQuery::build(()))
            .await
    }

    pub async fn cloud(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::CloudQuery::build(()))
            .await
    }

    pub async fn api_key(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{ApiKeyByIdQuery, PrefixedID, PrefixedIdVars};
        use cynic::QueryBuilder;
        self.run_typed(ApiKeyByIdQuery::build(PrefixedIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn disk(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{DiskByIdQuery, PrefixedID, PrefixedIdVars};
        use cynic::QueryBuilder;
        self.run_typed(DiskByIdQuery::build(PrefixedIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn oidc_provider(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{OidcProviderByIdQuery, PrefixedID, PrefixedIdVars};
        use cynic::QueryBuilder;
        self.run_typed(OidcProviderByIdQuery::build(PrefixedIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn ups_device_by_id(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{StringIdVars, UpsDeviceByIdQuery};
        use cynic::QueryBuilder;
        self.run_typed(UpsDeviceByIdQuery::build(StringIdVars {
            id: id.to_string(),
        }))
        .await
    }

    pub async fn plugin_install_operation(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{OperationIdVars, PluginInstallOperationByIdQuery};
        use cynic::QueryBuilder;
        self.run_typed(PluginInstallOperationByIdQuery::build(OperationIdVars {
            operation_id: cynic::Id::new(id),
        }))
        .await
    }

    pub async fn validate_oidc_session(&self, token: &str) -> Result<Value> {
        use crate::gql_typed::{TokenVars, ValidateOidcSessionQuery};
        use cynic::QueryBuilder;
        self.run_typed(ValidateOidcSessionQuery::build(TokenVars {
            token: token.to_string(),
        }))
        .await
    }

    pub async fn get_permissions_for_roles(&self, roles: &[String]) -> Result<Value> {
        use crate::gql_typed::{PermissionsForRolesQuery, Role, RolesVars};
        use cynic::QueryBuilder;
        let roles: Vec<Role> = serde_json::from_value(serde_json::to_value(roles)?)
            .map_err(|e| UpstreamError::Other(format!("invalid role value: {e}")))?;
        self.run_typed(PermissionsForRolesQuery::build(RolesVars { roles }))
            .await
    }

    // ── mutations (write) ──
    pub async fn recalculate_overview(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::RecalculateOverviewMutation::build(()))
            .await
    }

    pub async fn delete_archived_notifications(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::DeleteArchivedNotificationsMutation::build(()))
            .await
    }

    pub async fn archive_notification(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{ArchiveNotificationMutation, PrefixedID, PrefixedIdVars};
        use cynic::MutationBuilder;
        self.run_typed(ArchiveNotificationMutation::build(PrefixedIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn create_notification(
        &self,
        title: &str,
        subject: &str,
        description: &str,
        importance: &str,
        link: Option<&str>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            CreateNotificationMutation, CreateNotificationVars, NotificationData,
            NotificationImportance,
        };
        use cynic::MutationBuilder;
        let importance: NotificationImportance = serde_json::from_value(json!(importance))
            .map_err(|e| {
                UpstreamError::Other(format!(
                    "invalid importance (expected ALERT/INFO/WARNING): {e}"
                ))
            })?;
        let input = NotificationData {
            title: title.to_string(),
            subject: subject.to_string(),
            description: description.to_string(),
            importance,
            link: link.map(|s| s.to_string()),
        };
        self.run_typed(CreateNotificationMutation::build(CreateNotificationVars {
            input,
        }))
        .await
    }

    pub async fn vm_start(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, VmIdVars, VmStartMutation};
        use cynic::MutationBuilder;
        self.run_typed(VmStartMutation::build(VmIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn vm_stop(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, VmIdVars, VmStopMutation};
        use cynic::MutationBuilder;
        self.run_typed(VmStopMutation::build(VmIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn vm_pause(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, VmIdVars, VmPauseMutation};
        use cynic::MutationBuilder;
        self.run_typed(VmPauseMutation::build(VmIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn vm_resume(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, VmIdVars, VmResumeMutation};
        use cynic::MutationBuilder;
        self.run_typed(VmResumeMutation::build(VmIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn vm_force_stop(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, VmForceStopMutation, VmIdVars};
        use cynic::MutationBuilder;
        self.run_typed(VmForceStopMutation::build(VmIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn vm_reboot(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, VmIdVars, VmRebootMutation};
        use cynic::MutationBuilder;
        self.run_typed(VmRebootMutation::build(VmIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn vm_reset(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, VmIdVars, VmResetMutation};
        use cynic::MutationBuilder;
        self.run_typed(VmResetMutation::build(VmIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn docker_start(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{DockerIdVars, DockerStartMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(DockerStartMutation::build(DockerIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn docker_stop(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{DockerIdVars, DockerStopMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(DockerStopMutation::build(DockerIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn docker_restart(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{DockerIdVars, DockerRestartMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(DockerRestartMutation::build(DockerIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn docker_create_folder(
        &self,
        name: &str,
        parent_id: Option<&str>,
        children_ids: Option<&[String]>,
    ) -> Result<Value> {
        use crate::gql_typed::{CreateDockerFolderMutation, CreateDockerFolderVars};
        use cynic::MutationBuilder;
        self.run_typed(CreateDockerFolderMutation::build(CreateDockerFolderVars {
            name: name.to_string(),
            parent_id: parent_id.map(str::to_string),
            children_ids: children_ids.map(|v| v.to_vec()),
        }))
        .await
    }

    pub async fn docker_create_folder_with_items(
        &self,
        name: &str,
        parent_id: Option<&str>,
        source_entry_ids: Option<&[String]>,
        position: Option<f64>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            CreateDockerFolderWithItemsMutation, CreateDockerFolderWithItemsVars,
        };
        use cynic::MutationBuilder;
        self.run_typed(CreateDockerFolderWithItemsMutation::build(
            CreateDockerFolderWithItemsVars {
                name: name.to_string(),
                parent_id: parent_id.map(str::to_string),
                source_entry_ids: source_entry_ids.map(|v| v.to_vec()),
                position,
            },
        ))
        .await
    }

    pub async fn docker_set_folder_children(
        &self,
        folder_id: Option<&str>,
        children_ids: &[String],
    ) -> Result<Value> {
        use crate::gql_typed::{SetDockerFolderChildrenMutation, SetDockerFolderChildrenVars};
        use cynic::MutationBuilder;
        self.run_typed(SetDockerFolderChildrenMutation::build(
            SetDockerFolderChildrenVars {
                folder_id: folder_id.map(str::to_string),
                children_ids: children_ids.to_vec(),
            },
        ))
        .await
    }

    pub async fn docker_delete_entries(&self, entry_ids: &[String]) -> Result<Value> {
        use crate::gql_typed::{DeleteDockerEntriesMutation, DeleteDockerEntriesVars};
        use cynic::MutationBuilder;
        self.run_typed(DeleteDockerEntriesMutation::build(
            DeleteDockerEntriesVars {
                entry_ids: entry_ids.to_vec(),
            },
        ))
        .await
    }

    pub async fn docker_move_entries_to_folder(
        &self,
        source_entry_ids: &[String],
        destination_folder_id: &str,
    ) -> Result<Value> {
        use crate::gql_typed::{MoveDockerEntriesToFolderMutation, MoveDockerEntriesToFolderVars};
        use cynic::MutationBuilder;
        self.run_typed(MoveDockerEntriesToFolderMutation::build(
            MoveDockerEntriesToFolderVars {
                source_entry_ids: source_entry_ids.to_vec(),
                destination_folder_id: destination_folder_id.to_string(),
            },
        ))
        .await
    }

    pub async fn docker_move_items_to_position(
        &self,
        source_entry_ids: &[String],
        destination_folder_id: &str,
        position: f64,
    ) -> Result<Value> {
        use crate::gql_typed::{MoveDockerItemsToPositionMutation, MoveDockerItemsToPositionVars};
        use cynic::MutationBuilder;
        self.run_typed(MoveDockerItemsToPositionMutation::build(
            MoveDockerItemsToPositionVars {
                source_entry_ids: source_entry_ids.to_vec(),
                destination_folder_id: destination_folder_id.to_string(),
                position,
            },
        ))
        .await
    }

    pub async fn docker_rename_folder(&self, folder_id: &str, new_name: &str) -> Result<Value> {
        use crate::gql_typed::{RenameDockerFolderMutation, RenameDockerFolderVars};
        use cynic::MutationBuilder;
        self.run_typed(RenameDockerFolderMutation::build(RenameDockerFolderVars {
            folder_id: folder_id.to_string(),
            new_name: new_name.to_string(),
        }))
        .await
    }

    pub async fn docker_update_view_preferences(
        &self,
        view_id: Option<&str>,
        prefs: Value,
    ) -> Result<Value> {
        use crate::gql_typed::{
            Json, UpdateDockerViewPreferencesMutation, UpdateDockerViewPreferencesVars,
        };
        use cynic::MutationBuilder;
        self.run_typed(UpdateDockerViewPreferencesMutation::build(
            UpdateDockerViewPreferencesVars {
                view_id: view_id.map(str::to_string),
                prefs: Json(prefs),
            },
        ))
        .await
    }

    pub async fn docker_update_autostart_configuration(
        &self,
        entries: Value,
        persist_user_preferences: Option<bool>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            DockerAutostartEntryInput, DockerUpdateAutostartConfigurationMutation,
            UpdateAutostartConfigurationVars,
        };
        use cynic::MutationBuilder;
        let entries: Vec<DockerAutostartEntryInput> = serde_json::from_value(entries)
            .map_err(|e| UpstreamError::Other(format!("invalid autostart entries: {e}")))?;
        self.run_typed(DockerUpdateAutostartConfigurationMutation::build(
            UpdateAutostartConfigurationVars {
                entries,
                persist_user_preferences,
            },
        ))
        .await
    }

    pub async fn refresh_docker_digests(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::RefreshDockerDigestsMutation::build(()))
            .await
    }

    pub async fn reset_docker_template_mappings(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::ResetDockerTemplateMappingsMutation::build(()))
            .await
    }

    pub async fn sync_docker_template_paths(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::SyncDockerTemplatePathsMutation::build(()))
            .await
    }

    pub async fn docker_pause(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{DockerIdVars, DockerPauseMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(DockerPauseMutation::build(DockerIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn docker_unpause(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{DockerIdVars, DockerUnpauseMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(DockerUnpauseMutation::build(DockerIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn docker_update_container(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{DockerIdVars, DockerUpdateContainerMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(DockerUpdateContainerMutation::build(DockerIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn docker_remove_container(
        &self,
        id: &str,
        with_image: Option<bool>,
    ) -> Result<Value> {
        use crate::gql_typed::{DockerRemoveContainerMutation, DockerRemoveVars, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(DockerRemoveContainerMutation::build(DockerRemoveVars {
            id: PrefixedID(id.to_string()),
            with_image,
        }))
        .await
    }

    pub async fn docker_update_containers(&self, ids: &[String]) -> Result<Value> {
        use crate::gql_typed::{DockerIdsVars, DockerUpdateContainersMutation, PrefixedID};
        use cynic::MutationBuilder;
        let ids = ids.iter().map(|i| PrefixedID(i.clone())).collect();
        self.run_typed(DockerUpdateContainersMutation::build(DockerIdsVars { ids }))
            .await
    }

    pub async fn docker_update_all_containers(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::DockerUpdateAllContainersMutation::build(
            (),
        ))
        .await
    }

    pub async fn array_set_state(
        &self,
        desired_state: &str,
        decryption_password: Option<&str>,
        decryption_keyfile: Option<&str>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            ArraySetStateMutation, ArrayStateInput, ArrayStateInputState, ArrayStateInputVars,
        };
        use cynic::MutationBuilder;
        let desired_state: ArrayStateInputState = serde_json::from_value(json!(desired_state))
            .map_err(|e| {
                UpstreamError::Other(format!("invalid desired_state (START/STOP): {e}"))
            })?;
        let input = ArrayStateInput {
            desired_state,
            decryption_password: decryption_password.map(str::to_string),
            decryption_keyfile: decryption_keyfile.map(str::to_string),
        };
        self.run_typed(ArraySetStateMutation::build(ArrayStateInputVars { input }))
            .await
    }

    pub async fn array_add_disk_to_array(&self, id: &str, slot: Option<i32>) -> Result<Value> {
        use crate::gql_typed::{
            ArrayAddDiskToArrayMutation, ArrayDiskInput, ArrayDiskInputVars, PrefixedID,
        };
        use cynic::MutationBuilder;
        let input = ArrayDiskInput {
            id: PrefixedID(id.to_string()),
            slot,
        };
        self.run_typed(ArrayAddDiskToArrayMutation::build(ArrayDiskInputVars {
            input,
        }))
        .await
    }

    pub async fn array_remove_disk_from_array(&self, id: &str, slot: Option<i32>) -> Result<Value> {
        use crate::gql_typed::{
            ArrayDiskInput, ArrayDiskInputVars, ArrayRemoveDiskFromArrayMutation, PrefixedID,
        };
        use cynic::MutationBuilder;
        let input = ArrayDiskInput {
            id: PrefixedID(id.to_string()),
            slot,
        };
        self.run_typed(ArrayRemoveDiskFromArrayMutation::build(
            ArrayDiskInputVars { input },
        ))
        .await
    }

    pub async fn array_mount_array_disk(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{ArrayDiskIdVars, ArrayMountArrayDiskMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(ArrayMountArrayDiskMutation::build(ArrayDiskIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn array_unmount_array_disk(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{ArrayDiskIdVars, ArrayUnmountArrayDiskMutation, PrefixedID};
        use cynic::MutationBuilder;
        self.run_typed(ArrayUnmountArrayDiskMutation::build(ArrayDiskIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn array_clear_array_disk_statistics(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{
            ArrayClearArrayDiskStatisticsMutation, ArrayDiskIdVars, PrefixedID,
        };
        use cynic::MutationBuilder;
        self.run_typed(ArrayClearArrayDiskStatisticsMutation::build(
            ArrayDiskIdVars {
                id: PrefixedID(id.to_string()),
            },
        ))
        .await
    }

    pub async fn parity_check_start(&self, correct: bool) -> Result<Value> {
        use crate::gql_typed::{ParityCheckStartMutation, ParityCheckStartVars};
        use cynic::MutationBuilder;
        self.run_typed(ParityCheckStartMutation::build(ParityCheckStartVars {
            correct,
        }))
        .await
    }

    pub async fn parity_check_pause(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::ParityCheckPauseMutation::build(()))
            .await
    }

    pub async fn parity_check_resume(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::ParityCheckResumeMutation::build(()))
            .await
    }

    pub async fn parity_check_cancel(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::ParityCheckCancelMutation::build(()))
            .await
    }

    pub async fn api_key_create(
        &self,
        name: &str,
        description: Option<&str>,
        roles: Option<&[String]>,
        permissions: &Value,
        overwrite: Option<bool>,
    ) -> Result<Value> {
        use crate::gql_typed::{ApiKeyCreateMutation, CreateApiKeyInput, CreateApiKeyVars};
        use cynic::MutationBuilder;
        let input = CreateApiKeyInput {
            name: name.to_string(),
            description: description.map(|s| s.to_string()),
            roles: parse_roles(roles)?,
            permissions: parse_permissions(permissions)?,
            overwrite,
        };
        self.run_typed(ApiKeyCreateMutation::build(CreateApiKeyVars { input }))
            .await
    }

    pub async fn api_key_add_role(&self, api_key_id: &str, role: &str) -> Result<Value> {
        use crate::gql_typed::{
            AddRoleForApiKeyInput, AddRoleForApiKeyVars, ApiKeyAddRoleMutation, PrefixedID,
        };
        use cynic::MutationBuilder;
        let input = AddRoleForApiKeyInput {
            api_key_id: PrefixedID(api_key_id.to_string()),
            role: parse_role(role)?,
        };
        self.run_typed(ApiKeyAddRoleMutation::build(AddRoleForApiKeyVars { input }))
            .await
    }

    pub async fn api_key_remove_role(&self, api_key_id: &str, role: &str) -> Result<Value> {
        use crate::gql_typed::{
            ApiKeyRemoveRoleMutation, PrefixedID, RemoveRoleFromApiKeyInput,
            RemoveRoleFromApiKeyVars,
        };
        use cynic::MutationBuilder;
        let input = RemoveRoleFromApiKeyInput {
            api_key_id: PrefixedID(api_key_id.to_string()),
            role: parse_role(role)?,
        };
        self.run_typed(ApiKeyRemoveRoleMutation::build(RemoveRoleFromApiKeyVars {
            input,
        }))
        .await
    }

    pub async fn api_key_delete(&self, ids: &[String]) -> Result<Value> {
        use crate::gql_typed::{
            ApiKeyDeleteMutation, DeleteApiKeyInput, DeleteApiKeyVars, PrefixedID,
        };
        use cynic::MutationBuilder;
        let input = DeleteApiKeyInput {
            ids: ids.iter().map(|i| PrefixedID(i.clone())).collect(),
        };
        self.run_typed(ApiKeyDeleteMutation::build(DeleteApiKeyVars { input }))
            .await
    }

    pub async fn api_key_update(
        &self,
        id: &str,
        name: Option<&str>,
        description: Option<&str>,
        roles: Option<&[String]>,
        permissions: &Value,
    ) -> Result<Value> {
        use crate::gql_typed::{
            ApiKeyUpdateMutation, PrefixedID, UpdateApiKeyInput, UpdateApiKeyVars,
        };
        use cynic::MutationBuilder;
        let input = UpdateApiKeyInput {
            id: PrefixedID(id.to_string()),
            name: name.map(|s| s.to_string()),
            description: description.map(|s| s.to_string()),
            roles: parse_roles(roles)?,
            permissions: parse_permissions(permissions)?,
        };
        self.run_typed(ApiKeyUpdateMutation::build(UpdateApiKeyVars { input }))
            .await
    }

    pub async fn rclone_create_r_clone_remote(
        &self,
        name: &str,
        remote_type: &str,
        parameters: Value,
    ) -> Result<Value> {
        use crate::gql_typed::{
            CreateRCloneRemoteInput, CreateRCloneRemoteVars, Json, RcloneCreateRemoteMutation,
        };
        use cynic::MutationBuilder;
        let input = CreateRCloneRemoteInput {
            name: name.to_string(),
            r#type: remote_type.to_string(),
            parameters: Json(parameters),
        };
        self.run_typed(RcloneCreateRemoteMutation::build(CreateRCloneRemoteVars {
            input,
        }))
        .await
    }

    pub async fn rclone_delete_r_clone_remote(&self, name: &str) -> Result<Value> {
        use crate::gql_typed::{
            DeleteRCloneRemoteInput, DeleteRCloneRemoteVars, RcloneDeleteRemoteMutation,
        };
        use cynic::MutationBuilder;
        let input = DeleteRCloneRemoteInput {
            name: name.to_string(),
        };
        self.run_typed(RcloneDeleteRemoteMutation::build(DeleteRCloneRemoteVars {
            input,
        }))
        .await
    }

    pub async fn unraid_plugins_install_plugin(
        &self,
        url: &str,
        name: Option<&str>,
        forced: Option<bool>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            InstallPluginInput, InstallPluginVars, UnraidPluginsInstallPluginMutation,
        };
        use cynic::MutationBuilder;
        let input = InstallPluginInput {
            url: url.to_string(),
            name: name.map(|s| s.to_string()),
            forced,
        };
        self.run_typed(UnraidPluginsInstallPluginMutation::build(
            InstallPluginVars { input },
        ))
        .await
    }

    pub async fn unraid_plugins_install_language(
        &self,
        url: &str,
        name: Option<&str>,
        forced: Option<bool>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            InstallPluginInput, InstallPluginVars, UnraidPluginsInstallLanguageMutation,
        };
        use cynic::MutationBuilder;
        let input = InstallPluginInput {
            url: url.to_string(),
            name: name.map(|s| s.to_string()),
            forced,
        };
        self.run_typed(UnraidPluginsInstallLanguageMutation::build(
            InstallPluginVars { input },
        ))
        .await
    }

    pub async fn onboarding_complete_onboarding(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingCompleteMutation::build(()))
            .await
    }

    pub async fn onboarding_reset_onboarding(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingResetMutation::build(()))
            .await
    }

    pub async fn onboarding_bypass_onboarding(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingBypassMutation::build(()))
            .await
    }

    pub async fn onboarding_clear_onboarding_override(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingClearOverrideMutation::build(()))
            .await
    }

    pub async fn onboarding_close_onboarding(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingCloseMutation::build(()))
            .await
    }

    pub async fn onboarding_open_onboarding(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingOpenMutation::build(()))
            .await
    }

    pub async fn onboarding_resume_onboarding(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingResumeMutation::build(()))
            .await
    }

    pub async fn onboarding_refresh_internal_boot_context(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::OnboardingRefreshInternalBootContextMutation::build(()))
            .await
    }

    pub async fn onboarding_set_onboarding_override(&self, input: Value) -> Result<Value> {
        use crate::gql_typed::{
            OnboardingOverrideInput, OnboardingSetOverrideMutation, SetOnboardingOverrideVars,
        };
        use cynic::MutationBuilder;
        let input: OnboardingOverrideInput = serde_json::from_value(input)
            .map_err(|e| UpstreamError::Other(format!("invalid onboarding override: {e}")))?;
        self.run_typed(OnboardingSetOverrideMutation::build(
            SetOnboardingOverrideVars { input },
        ))
        .await
    }

    pub async fn onboarding_create_internal_boot_pool(
        &self,
        pool_name: &str,
        devices: &[String],
        boot_size_mib: i32,
        update_bios: bool,
        reboot: Option<bool>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            CreateInternalBootPoolInput, CreateInternalBootPoolVars,
            OnboardingCreateInternalBootPoolMutation,
        };
        use cynic::MutationBuilder;
        let input = CreateInternalBootPoolInput {
            pool_name: pool_name.to_string(),
            devices: devices.to_vec(),
            boot_size_mi_b: boot_size_mib,
            update_bios,
            reboot,
        };
        self.run_typed(OnboardingCreateInternalBootPoolMutation::build(
            CreateInternalBootPoolVars { input },
        ))
        .await
    }

    pub async fn archive_notifications(&self, ids: &[String]) -> Result<Value> {
        use crate::gql_typed::{ArchiveNotificationsMutation, NotificationIdsVars, PrefixedID};
        use cynic::MutationBuilder;
        let ids = ids.iter().map(|i| PrefixedID(i.clone())).collect();
        self.run_typed(ArchiveNotificationsMutation::build(NotificationIdsVars {
            ids,
        }))
        .await
    }

    pub async fn unarchive_notifications(&self, ids: &[String]) -> Result<Value> {
        use crate::gql_typed::{NotificationIdsVars, PrefixedID, UnarchiveNotificationsMutation};
        use cynic::MutationBuilder;
        let ids = ids.iter().map(|i| PrefixedID(i.clone())).collect();
        self.run_typed(UnarchiveNotificationsMutation::build(NotificationIdsVars {
            ids,
        }))
        .await
    }

    pub async fn unread_notification(&self, id: &str) -> Result<Value> {
        use crate::gql_typed::{PrefixedID, PrefixedIdVars, UnreadNotificationMutation};
        use cynic::MutationBuilder;
        self.run_typed(UnreadNotificationMutation::build(PrefixedIdVars {
            id: PrefixedID(id.to_string()),
        }))
        .await
    }

    pub async fn archive_all(&self, importance: Option<&str>) -> Result<Value> {
        use crate::gql_typed::{ArchiveAllMutation, NotificationImportanceVars};
        use cynic::MutationBuilder;
        let importance = parse_importance(importance)?;
        self.run_typed(ArchiveAllMutation::build(NotificationImportanceVars {
            importance,
        }))
        .await
    }

    pub async fn unarchive_all(&self, importance: Option<&str>) -> Result<Value> {
        use crate::gql_typed::{NotificationImportanceVars, UnarchiveAllMutation};
        use cynic::MutationBuilder;
        let importance = parse_importance(importance)?;
        self.run_typed(UnarchiveAllMutation::build(NotificationImportanceVars {
            importance,
        }))
        .await
    }

    pub async fn update_server_identity(
        &self,
        name: &str,
        comment: Option<&str>,
        sys_model: Option<&str>,
    ) -> Result<Value> {
        use crate::gql_typed::{UpdateServerIdentityMutation, UpdateServerIdentityVars};
        use cynic::MutationBuilder;
        let vars = UpdateServerIdentityVars {
            name: name.to_string(),
            comment: comment.map(|s| s.to_string()),
            sys_model: sys_model.map(|s| s.to_string()),
        };
        self.run_typed(UpdateServerIdentityMutation::build(vars))
            .await
    }

    pub async fn configure_ups(&self, config: Value) -> Result<Value> {
        use crate::gql_typed::{ConfigureUpsMutation, ConfigureUpsVars, UPSConfigInput};
        use cynic::MutationBuilder;
        let config: UPSConfigInput = serde_json::from_value(config)
            .map_err(|e| UpstreamError::Other(format!("invalid UPS config: {e}")))?;
        self.run_typed(ConfigureUpsMutation::build(ConfigureUpsVars { config }))
            .await
    }

    pub async fn update_system_time(&self, input: Value) -> Result<Value> {
        use crate::gql_typed::{
            UpdateSystemTimeInput, UpdateSystemTimeMutation, UpdateSystemTimeVars,
        };
        use cynic::MutationBuilder;
        let input: UpdateSystemTimeInput = serde_json::from_value(input)
            .map_err(|e| UpstreamError::Other(format!("invalid system time input: {e}")))?;
        self.run_typed(UpdateSystemTimeMutation::build(UpdateSystemTimeVars {
            input,
        }))
        .await
    }

    pub async fn update_temperature_config(&self, input: Value) -> Result<Value> {
        use crate::gql_typed::{
            TemperatureConfigInput, UpdateTemperatureConfigMutation, UpdateTemperatureConfigVars,
        };
        use cynic::MutationBuilder;
        let input: TemperatureConfigInput = serde_json::from_value(input)
            .map_err(|e| UpstreamError::Other(format!("invalid temperature config: {e}")))?;
        self.run_typed(UpdateTemperatureConfigMutation::build(
            UpdateTemperatureConfigVars { input },
        ))
        .await
    }

    pub async fn add_plugin(&self, input: Value) -> Result<Value> {
        use crate::gql_typed::{AddPluginMutation, PluginManagementInput, PluginManagementVars};
        use cynic::MutationBuilder;
        let input: PluginManagementInput = serde_json::from_value(input)
            .map_err(|e| UpstreamError::Other(format!("invalid plugin input: {e}")))?;
        self.run_typed(AddPluginMutation::build(PluginManagementVars { input }))
            .await
    }

    pub async fn remove_plugin(&self, input: Value) -> Result<Value> {
        use crate::gql_typed::{PluginManagementInput, PluginManagementVars, RemovePluginMutation};
        use cynic::MutationBuilder;
        let input: PluginManagementInput = serde_json::from_value(input)
            .map_err(|e| UpstreamError::Other(format!("invalid plugin input: {e}")))?;
        self.run_typed(RemovePluginMutation::build(PluginManagementVars { input }))
            .await
    }

    pub async fn connect_sign_out(&self) -> Result<Value> {
        use cynic::MutationBuilder;
        self.run_typed(crate::gql_typed::ConnectSignOutMutation::build(()))
            .await
    }

    pub async fn connect_sign_in(&self, api_key: &str, user_info: Option<Value>) -> Result<Value> {
        use crate::gql_typed::{ConnectSignInInput, ConnectSignInMutation, ConnectSignInVars};
        use cynic::MutationBuilder;
        let user_info = match user_info {
            Some(v) => Some(
                serde_json::from_value(v)
                    .map_err(|e| UpstreamError::Other(format!("invalid user_info: {e}")))?,
            ),
            None => None,
        };
        let input = ConnectSignInInput {
            api_key: api_key.to_string(),
            user_info,
        };
        self.run_typed(ConnectSignInMutation::build(ConnectSignInVars { input }))
            .await
    }

    pub async fn setup_remote_access(
        &self,
        access_type: &str,
        forward_type: Option<&str>,
        port: Option<i32>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            SetupRemoteAccessInput, SetupRemoteAccessMutation, SetupRemoteAccessVars,
        };
        use cynic::MutationBuilder;
        let access_type = serde_json::from_value(json!(access_type))
            .map_err(|e| UpstreamError::Other(format!("invalid access_type: {e}")))?;
        let forward_type = match forward_type {
            Some(v) => Some(
                serde_json::from_value(json!(v))
                    .map_err(|e| UpstreamError::Other(format!("invalid forward_type: {e}")))?,
            ),
            None => None,
        };
        let input = SetupRemoteAccessInput {
            access_type,
            forward_type,
            port,
        };
        self.run_typed(SetupRemoteAccessMutation::build(SetupRemoteAccessVars {
            input,
        }))
        .await
    }

    pub async fn enable_dynamic_remote_access(&self, url: Value, enabled: bool) -> Result<Value> {
        use crate::gql_typed::{
            AccessUrlInput, EnableDynamicRemoteAccessInput, EnableDynamicRemoteAccessMutation,
            EnableDynamicRemoteAccessVars,
        };
        use cynic::MutationBuilder;
        let url: AccessUrlInput = serde_json::from_value(url)
            .map_err(|e| UpstreamError::Other(format!("invalid url: {e}")))?;
        let input = EnableDynamicRemoteAccessInput { url, enabled };
        self.run_typed(EnableDynamicRemoteAccessMutation::build(
            EnableDynamicRemoteAccessVars { input },
        ))
        .await
    }

    pub async fn update_api_settings(
        &self,
        access_type: Option<&str>,
        forward_type: Option<&str>,
        port: Option<i32>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            ConnectSettingsInput, UpdateApiSettingsMutation, UpdateApiSettingsVars,
        };
        use cynic::MutationBuilder;
        let access_type = match access_type {
            Some(v) => Some(
                serde_json::from_value(json!(v))
                    .map_err(|e| UpstreamError::Other(format!("invalid access_type: {e}")))?,
            ),
            None => None,
        };
        let forward_type = match forward_type {
            Some(v) => Some(
                serde_json::from_value(json!(v))
                    .map_err(|e| UpstreamError::Other(format!("invalid forward_type: {e}")))?,
            ),
            None => None,
        };
        let input = ConnectSettingsInput {
            access_type,
            forward_type,
            port,
        };
        self.run_typed(UpdateApiSettingsMutation::build(UpdateApiSettingsVars {
            input,
        }))
        .await
    }

    pub async fn update_settings(&self, input: Value) -> Result<Value> {
        use crate::gql_typed::{Json, UpdateSettingsMutation, UpdateSettingsVars};
        use cynic::MutationBuilder;
        self.run_typed(UpdateSettingsMutation::build(UpdateSettingsVars {
            input: Json(input),
        }))
        .await
    }

    pub async fn update_ssh_settings(&self, enabled: bool, port: i32) -> Result<Value> {
        use crate::gql_typed::{UpdateSshInput, UpdateSshSettingsMutation, UpdateSshSettingsVars};
        use cynic::MutationBuilder;
        let input = UpdateSshInput { enabled, port };
        self.run_typed(UpdateSshSettingsMutation::build(UpdateSshSettingsVars {
            input,
        }))
        .await
    }

    pub async fn initiate_flash_backup(
        &self,
        remote_name: &str,
        source_path: &str,
        destination_path: &str,
        options: Option<Value>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            InitiateFlashBackupInput, InitiateFlashBackupMutation, InitiateFlashBackupVars, Json,
        };
        use cynic::MutationBuilder;
        let input = InitiateFlashBackupInput {
            remote_name: remote_name.to_string(),
            source_path: source_path.to_string(),
            destination_path: destination_path.to_string(),
            options: options.map(Json),
        };
        self.run_typed(InitiateFlashBackupMutation::build(
            InitiateFlashBackupVars { input },
        ))
        .await
    }

    pub async fn notify_if_unique(
        &self,
        title: &str,
        subject: &str,
        description: &str,
        importance: &str,
        link: Option<&str>,
    ) -> Result<Value> {
        use crate::gql_typed::{
            NotificationData, NotificationImportance, NotifyIfUniqueMutation, NotifyIfUniqueVars,
        };
        use cynic::MutationBuilder;
        let importance: NotificationImportance = serde_json::from_value(json!(importance))
            .map_err(|e| {
                UpstreamError::Other(format!(
                    "invalid importance (expected ALERT/INFO/WARNING): {e}"
                ))
            })?;
        let input = NotificationData {
            title: title.to_string(),
            subject: subject.to_string(),
            description: description.to_string(),
            importance,
            link: link.map(|s| s.to_string()),
        };
        self.run_typed(NotifyIfUniqueMutation::build(NotifyIfUniqueVars { input }))
            .await
    }

    pub async fn customization_set_locale(&self, locale: &str) -> Result<Value> {
        use crate::gql_typed::{CustomizationSetLocaleMutation, SetLocaleVars};
        use cynic::MutationBuilder;
        self.run_typed(CustomizationSetLocaleMutation::build(SetLocaleVars {
            locale: locale.to_string(),
        }))
        .await
    }

    pub async fn customization_set_theme(&self, theme: &str) -> Result<Value> {
        use crate::gql_typed::{CustomizationSetThemeMutation, SetThemeVars};
        use cynic::MutationBuilder;
        let theme = serde_json::from_value(json!(theme))
            .map_err(|e| UpstreamError::Other(format!("invalid theme: {e}")))?;
        self.run_typed(CustomizationSetThemeMutation::build(SetThemeVars { theme }))
            .await
    }

    pub async fn preview_effective_permissions(
        &self,
        roles: Option<&[String]>,
        permissions: &Value,
    ) -> Result<Value> {
        use crate::gql_typed::{PreviewEffectivePermissionsQuery, PreviewEffectivePermissionsVars};
        use cynic::QueryBuilder;
        self.run_typed(PreviewEffectivePermissionsQuery::build(
            PreviewEffectivePermissionsVars {
                roles: parse_roles(roles)?,
                permissions: parse_permissions(permissions)?,
            },
        ))
        .await
    }

    // ── queries ───────────────────────────────────────────────────────────────

    pub async fn array(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ArrayQuery::build(()))
            .await
    }

    pub async fn disks(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::DisksReadQuery::build(()))
            .await
    }

    pub async fn docker(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::DockerReadQuery::build(()))
            .await
    }

    pub async fn docker_logs(&self, container_id: &str, tail: Option<i64>) -> Result<Value> {
        use crate::gql_typed::{DockerLogsReadQuery, DockerLogsVars, PrefixedID};
        use cynic::QueryBuilder;
        let vars = DockerLogsVars {
            id: PrefixedID(container_id.to_string()),
            tail: Some(tail.unwrap_or(100) as i32),
        };
        self.run_typed(DockerLogsReadQuery::build(vars)).await
    }

    pub async fn vms(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::VmsReadQuery::build(()))
            .await
    }

    pub async fn server(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ServerReadQuery::build(()))
            .await
    }

    pub async fn info(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::InfoReadQuery::build(()))
            .await
    }

    pub async fn shares(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::SharesQuery::build(()))
            .await
    }

    pub async fn notifications(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::NotificationsQuery::build(()))
            .await
    }

    pub async fn log_files(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::LogFilesQuery::build(()))
            .await
    }

    pub async fn log_file(
        &self,
        path: &str,
        lines: Option<i64>,
        start_line: Option<i64>,
    ) -> Result<Value> {
        use crate::gql_typed::{LogFileQuery, LogFileVars};
        use cynic::QueryBuilder;
        let vars = LogFileVars {
            path: path.to_string(),
            lines: lines.map(|n| n as i32),
            start_line: start_line.map(|n| n as i32),
        };
        self.run_typed(LogFileQuery::build(vars)).await
    }

    pub async fn services(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ServicesQuery::build(()))
            .await
    }

    pub async fn network(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::NetworkQuery::build(()))
            .await
    }

    pub async fn ups(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::UpsQuery::build(())).await
    }

    pub async fn ups_config(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::UpsConfigQuery::build(()))
            .await
    }

    pub async fn metrics(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::MetricsQuery::build(()))
            .await
    }

    pub async fn plugins(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::PluginsQuery::build(()))
            .await
    }

    pub async fn parity_history(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ParityHistoryQuery::build(()))
            .await
    }

    pub async fn vars(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::VarsReadQuery::build(()))
            .await
    }

    pub async fn registration(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::RegistrationReadQuery::build(()))
            .await
    }

    pub async fn flash(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::FlashQuery::build(()))
            .await
    }

    pub async fn rclone(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::RcloneQuery::build(()))
            .await
    }

    pub async fn remote_access(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::RemoteAccessReadQuery::build(()))
            .await
    }

    pub async fn connect(&self) -> Result<Value> {
        use cynic::QueryBuilder;
        self.run_typed(crate::gql_typed::ConnectReadQuery::build(()))
            .await
    }
}
