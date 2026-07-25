//! In-memory mock of the Unraid GraphQL upstream.
//!
//! The Rust side treats every GraphQL response as an opaque `serde_json::Value`,
//! so a faithful mock needs no GraphQL engine at all: it only has to recognise
//! *which* query is being asked and hand back a canned `data` payload. This
//! module provides that recognition ([`classify_query`]) plus the scenario
//! fixtures ([`Scenario`]) shared by both consumers:
//!
//!   * `examples/mock_unraid.rs` — a standalone HTTP server you point the real
//!     `runraid` binary / MCP transport / Claude skill at.
//!   * `tests/scenarios.rs` — mounts the same router on a wiremock server.
//!
//! Gated behind the `test-support` feature (and `cfg(test)`); it is never part
//! of a release build.

use std::collections::BTreeMap;

use graphql_parser::query::{Definition, OperationDefinition, Selection};
use serde_json::{Map, Value};

/// The realistic baseline. Every other scenario is a thin overlay on top of it.
const HEALTHY: &str = include_str!("../tests/fixtures/scenarios/healthy.json");
const DEGRADED: &str = include_str!("../tests/fixtures/scenarios/degraded.json");
const PARITY_RUNNING: &str = include_str!("../tests/fixtures/scenarios/parity-running.json");
const DISK_FAILING: &str = include_str!("../tests/fixtures/scenarios/disk-failing.json");

/// All scenario names known to the mock, in a stable order.
pub const SCENARIOS: &[&str] = &["healthy", "degraded", "parity-running", "disk-failing"];

/// Raw overlay JSON for a scenario name (the embedded fixture file), or `None`
/// if the name is unknown. `healthy` returns its own full fixture.
fn raw_overlay(name: &str) -> Option<&'static str> {
    match name {
        "healthy" => Some(HEALTHY),
        "degraded" => Some(DEGRADED),
        "parity-running" => Some(PARITY_RUNNING),
        "disk-failing" => Some(DISK_FAILING),
        _ => None,
    }
}

/// Map a raw GraphQL query string to the fixture key (the `action` name) that
/// serves it, by **parsing the query AST** and routing on the operation's root
/// field name. For almost every action the fixture key is just the snake_case of
/// the GraphQL root field (`systemTime` → `system_time`), so new actions route
/// automatically with no edit here. Only the handful that don't follow that rule
/// are listed explicitly: `docker`'s `logs` sub-selection (→ `docker_logs`) and
/// the UPS fields whose action names are abbreviated.
///
/// Robust to whitespace, field reordering, and comments — unlike substring
/// matching. `None` only if the query doesn't parse / has no root field; an
/// unknown-but-parseable field maps to a key with no fixture, which the server
/// turns into a GraphQL `errors` response (exactly as a real server would).
pub fn classify_query(query: &str) -> Option<std::borrow::Cow<'static, str>> {
    use std::borrow::Cow;
    let (root, subfields, is_mutation) = root_field(query)?;

    // Namespaced mutations (`mutation { vm { start } }`) share their root field
    // with a query (`query { vms }` / there is no `vm` query, but `array`/`docker`
    // collide). Disambiguate by operation type + sub-field, so the action key is
    // `<namespace>_<sub>` (e.g. `vm_start`, `array_set_state`).
    const NS: &[&str] = &[
        "array",
        "docker",
        "vm",
        "parityCheck",
        "apiKey",
        "rclone",
        "customization",
        "onboarding",
        "unraidPlugins",
    ];
    if is_mutation {
        if NS.contains(&root) {
            if let Some(sub) = subfields.first() {
                return Some(Cow::Owned(format!(
                    "{}_{}",
                    to_snake_case(root),
                    to_snake_case(sub)
                )));
            }
        }
        // The Docker Organizer mutations are direct Mutation-root fields (not
        // nested under `docker { ... }`), but their MCP action names carry a
        // `docker_` prefix for discoverability alongside docker_start/stop/etc.
        // Map the bare root field name to that prefixed action/fixture key.
        const DOCKER_ORGANIZER: &[(&str, &str)] = &[
            ("createDockerFolder", "docker_create_folder"),
            (
                "createDockerFolderWithItems",
                "docker_create_folder_with_items",
            ),
            ("setDockerFolderChildren", "docker_set_folder_children"),
            ("deleteDockerEntries", "docker_delete_entries"),
            ("moveDockerEntriesToFolder", "docker_move_entries_to_folder"),
            ("moveDockerItemsToPosition", "docker_move_items_to_position"),
            ("renameDockerFolder", "docker_rename_folder"),
            (
                "updateDockerViewPreferences",
                "docker_update_view_preferences",
            ),
        ];
        if let Some((_, key)) = DOCKER_ORGANIZER.iter().find(|(field, _)| *field == root) {
            return Some(Cow::Borrowed(*key));
        }
        return Some(Cow::Owned(to_snake_case(root)));
    }

    Some(match root {
        "docker" if subfields.contains(&"logs") => Cow::Borrowed("docker_logs"),
        "upsDevices" => Cow::Borrowed("ups"),
        "upsConfiguration" => Cow::Borrowed("ups_config"),
        other => Cow::Owned(to_snake_case(other)),
    })
}

/// camelCase GraphQL field name → snake_case action / fixture key, acronym-aware
/// so `isSSOEnabled` → `is_sso_enabled` (not `is_s_s_o_enabled`). A `_` is
/// inserted before an uppercase letter that follows a lowercase/digit, or that
/// ends an acronym run (uppercase followed by a lowercase).
fn to_snake_case(s: &str) -> String {
    let chars: Vec<char> = s.chars().collect();
    let mut out = String::with_capacity(s.len() + 4);
    for (i, &c) in chars.iter().enumerate() {
        if c.is_ascii_uppercase() {
            let prev_boundary =
                i > 0 && (chars[i - 1].is_ascii_lowercase() || chars[i - 1].is_ascii_digit());
            let acronym_end = i > 0
                && chars[i - 1].is_ascii_uppercase()
                && i + 1 < chars.len()
                && chars[i + 1].is_ascii_lowercase();
            if prev_boundary || acronym_end {
                out.push('_');
            }
            out.push(c.to_ascii_lowercase());
        } else {
            out.push(c);
        }
    }
    out
}

/// Parse `query` and return its first operation's root field name together with
/// that field's immediate sub-field names. `None` if the query doesn't parse or
/// has no field selection at the root.
fn root_field(query: &str) -> Option<(&str, Vec<&str>, bool)> {
    let doc = graphql_parser::parse_query::<&str>(query).ok()?;
    doc.definitions.iter().find_map(|def| {
        let (selection_set, is_mutation) = match def {
            Definition::Operation(OperationDefinition::Query(q)) => (&q.selection_set, false),
            Definition::Operation(OperationDefinition::SelectionSet(s)) => (s, false),
            Definition::Operation(OperationDefinition::Mutation(m)) => (&m.selection_set, true),
            Definition::Operation(OperationDefinition::Subscription(s)) => {
                (&s.selection_set, false)
            }
            Definition::Fragment(_) => return None,
        };
        let field = selection_set.items.iter().find_map(|s| match s {
            Selection::Field(f) => Some(f),
            _ => None,
        })?;
        let subfields = field
            .selection_set
            .items
            .iter()
            .filter_map(|s| match s {
                Selection::Field(f) => Some(f.name),
                _ => None,
            })
            .collect();
        Some((field.name, subfields, is_mutation))
    })
}

/// A fully-resolved scenario: fixture key → the `data` payload returned for that
/// query (already the object that belongs under GraphQL's top-level `data`).
#[derive(Debug, Clone)]
pub struct Scenario {
    pub name: String,
    payloads: BTreeMap<String, Value>,
}

impl Scenario {
    /// Resolve a scenario by name: parse the `healthy` baseline, then replace
    /// any fixture keys the named overlay provides. Keys beginning with `_`
    /// (e.g. `_note`) are treated as documentation and skipped.
    ///
    /// Returns `None` for an unknown scenario name.
    pub fn load(name: &str) -> Option<Self> {
        let overlay_src = raw_overlay(name)?;

        let mut payloads = parse_fixture(HEALTHY);
        if name != "healthy" {
            for (key, value) in parse_fixture(overlay_src) {
                payloads.insert(key, value);
            }
        }

        Some(Self {
            name: name.to_string(),
            payloads,
        })
    }

    /// The `data` payload for a fixture key, if present.
    pub fn payload(&self, key: &str) -> Option<&Value> {
        self.payloads.get(key)
    }

    /// Resolve a raw GraphQL query directly to a full response body
    /// (`{"data": …}`), or a GraphQL `errors` body when the query is not
    /// recognised. This is the whole server behaviour in one call.
    pub fn respond(&self, query: &str) -> Value {
        match classify_query(query).and_then(|key| self.payload(&key)) {
            Some(data) => serde_json::json!({ "data": data }),
            None => serde_json::json!({
                "errors": [{
                    "message": "mock-unraid: no fixture matches this query",
                    "extensions": { "code": "MOCK_UNKNOWN_QUERY" }
                }]
            }),
        }
    }
}

/// Parse a fixture file into fixture-key → payload, dropping `_`-prefixed keys.
fn parse_fixture(src: &str) -> BTreeMap<String, Value> {
    let map: Map<String, Value> =
        serde_json::from_str(src).expect("embedded scenario fixture must be valid JSON");
    map.into_iter()
        .filter(|(k, _)| !k.starts_with('_'))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_scenario_loads_and_inherits_baseline() {
        for name in SCENARIOS {
            let s = Scenario::load(name).unwrap_or_else(|| panic!("scenario {name} should load"));
            // Inherited-from-baseline keys are always present, even in overlays
            // that don't mention them.
            assert!(s.payload("info").is_some(), "{name} missing inherited info");
            assert!(s.payload("array").is_some(), "{name} missing array");
        }
    }

    #[test]
    fn unknown_scenario_is_none() {
        assert!(Scenario::load("does-not-exist").is_none());
    }

    #[test]
    fn baseline_has_every_known_action() {
        // Each classifiable action must resolve to a payload in the baseline,
        // otherwise the standalone server would 'errors' on a real query.
        let healthy = Scenario::load("healthy").unwrap();
        let expected = [
            "array",
            "disks",
            "docker",
            "docker_logs",
            "vms",
            "server",
            "info",
            "shares",
            "notifications",
            "log_files",
            "log_file",
            "services",
            "network",
            "ups",
            "ups_config",
            "metrics",
            "plugins",
            "parity_history",
            "vars",
            "registration",
            "flash",
            "rclone",
            "remote_access",
            "connect",
        ];
        for key in expected {
            assert!(
                healthy.payload(key).is_some(),
                "baseline fixture is missing the `{key}` payload"
            );
        }
    }

    #[test]
    fn classify_routes_overlapping_queries() {
        let classify = |q| classify_query(q).map(|c| c.into_owned());
        // docker_logs vs docker
        assert_eq!(
            classify("query($id: PrefixedID!, $tail: Int) { docker { logs(id: $id, tail: $tail) { lines } } }").as_deref(),
            Some("docker_logs")
        );
        assert_eq!(
            classify("query { docker { containers { id names } } }").as_deref(),
            Some("docker")
        );
        // log_file vs log_files (snake_case of the root field)
        assert_eq!(
            classify("query($path: String!) { logFile(path: $path) { content } }").as_deref(),
            Some("log_file")
        );
        assert_eq!(
            classify("query { logFiles { name path } }").as_deref(),
            Some("log_files")
        );
        // connect vs remote_access (substring overlap that substring routing would trip on)
        assert_eq!(
            classify("query { connect { id dynamicRemoteAccess { error } } }").as_deref(),
            Some("connect")
        );
        assert_eq!(
            classify("query { remoteAccess { accessType forwardType port } }").as_deref(),
            Some("remote_access")
        );
        // array vs disks (both mention nested `disks {`)
        assert_eq!(
            classify("query { array { state parityCheckStatus { status } disks { id } } }")
                .as_deref(),
            Some("array")
        );
        assert_eq!(
            classify("query { disks { id smartStatus temperature } }").as_deref(),
            Some("disks")
        );
        // UPS abbreviations are the explicit exceptions
        assert_eq!(
            classify("query { upsDevices { id } }").as_deref(),
            Some("ups")
        );
        assert_eq!(
            classify("query { upsConfiguration { service } }").as_deref(),
            Some("ups_config")
        );
        // new actions route automatically via snake_case — no edit needed
        assert_eq!(
            classify("query { systemTime { currentTime } }").as_deref(),
            Some("system_time")
        );
        assert_eq!(classify("query { online }").as_deref(), Some("online"));
    }

    #[test]
    fn unknown_query_yields_errors_body() {
        let healthy = Scenario::load("healthy").unwrap();
        let body = healthy.respond("query { somethingNobodyAskedFor }");
        assert!(body.get("errors").is_some());
        assert!(body.get("data").is_none());
    }

    #[test]
    fn degraded_overrides_array_but_keeps_info() {
        let healthy = Scenario::load("healthy").unwrap();
        let degraded = Scenario::load("degraded").unwrap();
        // info is inherited verbatim
        assert_eq!(degraded.payload("info"), healthy.payload("info"));
        // array differs (a disk is disabled)
        assert_ne!(degraded.payload("array"), healthy.payload("array"));
    }
}
