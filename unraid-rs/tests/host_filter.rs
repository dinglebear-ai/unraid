//! Coverage for the Host-header / CORS allowlist computation in
//! `src/mcp/host_filter.rs` (P2-9). These functions are security-adjacent:
//! they decide which `Host` headers and CORS origins the MCP server accepts.
//!
//! The test-support API is re-exported from `unraid_rmcp::testing`:
//!   - `allowed_hosts(&McpConfig) -> Vec<String>`
//!   - `allowed_origins(&McpConfig) -> Vec<String>`
//!
//! Assertions are derived directly from the implementation, not assumptions:
//!   - IPv6 hosts are bracketed: `::1` -> `[::1]` and `[::1]:<port>`.
//!   - A host that already has a port is not given another.
//!   - public_url wildcard hosts are skipped (never added verbatim).
//!   - https public_url with no explicit port -> bare host + `host:443`.
//!   - http public_url with no explicit port -> bare host + `host:80`.
//!   - public_url with an explicit port -> `host` and `host:<port>`.

use unraid_rmcp::config::McpConfig;
use unraid_rmcp::testing::{allowed_hosts, allowed_origins};

fn has(v: &[String], needle: &str) -> bool {
    v.iter().any(|s| s == needle)
}

// ── 1. Default config ───────────────────────────────────────────────────────

#[test]
fn default_allowed_hosts_includes_loopback_and_bind_variants() {
    let config = McpConfig::default();
    let port = config.port; // 40010 per config.rs default
    let hosts = allowed_hosts(&config);

    // Bare loopback names are always present.
    assert!(has(&hosts, "localhost"), "missing localhost: {hosts:?}");
    assert!(has(&hosts, "127.0.0.1"), "missing 127.0.0.1: {hosts:?}");

    // host:port variants for the loopback names.
    assert!(
        has(&hosts, &format!("localhost:{port}")),
        "missing localhost:{port}: {hosts:?}"
    );
    assert!(
        has(&hosts, &format!("127.0.0.1:{port}")),
        "missing 127.0.0.1:{port}: {hosts:?}"
    );

    // The default bind host is "0.0.0.0"; it and its port variant are present.
    assert!(has(&hosts, "0.0.0.0"), "missing 0.0.0.0: {hosts:?}");
    assert!(
        has(&hosts, &format!("0.0.0.0:{port}")),
        "missing 0.0.0.0:{port}: {hosts:?}"
    );

    // ::1 is always pushed and bracketed (it parses as an Ipv6Addr).
    assert!(has(&hosts, "::1"), "missing ::1: {hosts:?}");
    assert!(has(&hosts, "[::1]"), "missing [::1]: {hosts:?}");
    assert!(
        has(&hosts, &format!("[::1]:{port}")),
        "missing [::1]:{port}: {hosts:?}"
    );

    // The vector is sorted and deduped.
    let mut sorted = hosts.clone();
    sorted.sort();
    sorted.dedup();
    assert_eq!(hosts, sorted, "hosts should be sorted and deduped");
}

#[test]
fn default_allowed_origins_includes_loopback_origins_at_port() {
    let config = McpConfig::default();
    let port = config.port;
    let origins = allowed_origins(&config);

    assert!(
        has(&origins, &format!("http://localhost:{port}")),
        "missing http://localhost:{port}: {origins:?}"
    );
    assert!(
        has(&origins, &format!("http://127.0.0.1:{port}")),
        "missing http://127.0.0.1:{port}: {origins:?}"
    );

    let mut sorted = origins.clone();
    sorted.sort();
    sorted.dedup();
    assert_eq!(origins, sorted, "origins should be sorted and deduped");
}

// ── 2. IPv6 bind host ─────────────────────────────────────────────────────────

#[test]
fn ipv6_bind_host_is_bracketed() {
    let config = McpConfig {
        host: "::1".to_string(),
        ..McpConfig::default()
    };
    let port = config.port;
    let hosts = allowed_hosts(&config);

    // push_host_variants pushes the bare form, then the bracketed forms.
    assert!(has(&hosts, "::1"), "missing bare ::1: {hosts:?}");
    assert!(has(&hosts, "[::1]"), "missing [::1]: {hosts:?}");
    assert!(
        has(&hosts, &format!("[::1]:{port}")),
        "missing [::1]:{port}: {hosts:?}"
    );

    // It is NOT given a bare ::1:<port> form (only the bracketed variant).
    assert!(
        !has(&hosts, &format!("::1:{port}")),
        "unexpected unbracketed ::1:{port}: {hosts:?}"
    );
}

#[test]
fn already_bracketed_ipv6_with_port_is_left_untouched() {
    // A host that is already `[addr]:port` should be pushed verbatim and not
    // expanded further (early return in push_host_variants).
    let config = McpConfig {
        host: "[2001:db8::1]:9999".to_string(),
        ..McpConfig::default()
    };
    let hosts = allowed_hosts(&config);

    assert!(
        has(&hosts, "[2001:db8::1]:9999"),
        "missing verbatim bracketed host:port: {hosts:?}"
    );
    // No double-bracketing / extra port suffix appended.
    assert!(
        !hosts.iter().any(|h| h.contains("[2001:db8::1]:9999:")),
        "host:port got an extra suffix: {hosts:?}"
    );
}

// ── 3. public_url with a wildcard ─────────────────────────────────────────────

#[test]
fn wildcard_public_url_host_is_not_added() {
    let mut config = McpConfig::default();
    config.auth.public_url = Some("https://*.example.com".to_string());
    let hosts = allowed_hosts(&config);
    let origins = allowed_origins(&config);

    // The wildcard host must never appear verbatim in either list.
    assert!(
        !hosts.iter().any(|h| h.contains('*')),
        "wildcard leaked into allowed_hosts: {hosts:?}"
    );
    assert!(
        !origins.iter().any(|o| o.contains('*')),
        "wildcard leaked into allowed_origins: {origins:?}"
    );
    // And nothing resembling example.com is added from the wildcard URL.
    assert!(
        !hosts.iter().any(|h| h.contains("example.com")),
        "wildcard public_url added an example.com host: {hosts:?}"
    );
    assert!(
        !origins.iter().any(|o| o.contains("example.com")),
        "wildcard public_url added an example.com origin: {origins:?}"
    );
}

// ── 4. https public_url with no explicit port ─────────────────────────────────

#[test]
fn https_public_url_adds_bare_host_and_443_variant() {
    let mut config = McpConfig::default();
    config.auth.public_url = Some("https://unraid.example.com".to_string());
    let hosts = allowed_hosts(&config);

    // scheme_default for https is 443: both bare and :443 variants are added.
    assert!(
        has(&hosts, "unraid.example.com"),
        "missing bare https host: {hosts:?}"
    );
    assert!(
        has(&hosts, "unraid.example.com:443"),
        "missing https host:443 variant: {hosts:?}"
    );
}

#[test]
fn https_public_url_origin_omits_default_port() {
    let mut config = McpConfig::default();
    config.auth.public_url = Some("https://unraid.example.com".to_string());
    let origins = allowed_origins(&config);

    // extract_origin drops the default port (443) from the origin string.
    assert!(
        has(&origins, "https://unraid.example.com"),
        "missing https origin: {origins:?}"
    );
    assert!(
        !has(&origins, "https://unraid.example.com:443"),
        "origin should not include default 443 port: {origins:?}"
    );
}

// ── 4b. http public_url with no explicit port ─────────────────────────────────

#[test]
fn http_public_url_adds_bare_host_and_80_variant() {
    let mut config = McpConfig::default();
    config.auth.public_url = Some("http://unraid.example.com".to_string());
    let hosts = allowed_hosts(&config);

    // scheme_default for http is 80.
    assert!(
        has(&hosts, "unraid.example.com"),
        "missing bare http host: {hosts:?}"
    );
    assert!(
        has(&hosts, "unraid.example.com:80"),
        "missing http host:80 variant: {hosts:?}"
    );
}

// ── 4c. public_url with an explicit non-default port ──────────────────────────

#[test]
fn public_url_with_explicit_port_adds_host_and_that_port() {
    let mut config = McpConfig::default();
    config.auth.public_url = Some("https://unraid.example.com:8443".to_string());
    let hosts = allowed_hosts(&config);
    let origins = allowed_origins(&config);

    // explicit_port branch: push_host_variants(host, 8443) yields bare host +
    // host:8443.
    assert!(
        has(&hosts, "unraid.example.com"),
        "missing bare host for explicit-port url: {hosts:?}"
    );
    assert!(
        has(&hosts, "unraid.example.com:8443"),
        "missing host:8443 for explicit-port url: {hosts:?}"
    );

    // Non-default port is preserved in the origin.
    assert!(
        has(&origins, "https://unraid.example.com:8443"),
        "missing explicit-port origin: {origins:?}"
    );
}

// ── 5. Extra configured allowed_hosts / allowed_origins ───────────────────────

#[test]
fn extra_allowed_hosts_are_included_with_port_variant() {
    let config = McpConfig {
        allowed_hosts: vec!["unraid.local".to_string()],
        ..McpConfig::default()
    };
    let port = config.port;
    let hosts = allowed_hosts(&config);

    // A plain hostname with no port gets a host:port variant added.
    assert!(has(&hosts, "unraid.local"), "missing extra host: {hosts:?}");
    assert!(
        has(&hosts, &format!("unraid.local:{port}")),
        "missing extra host:port variant: {hosts:?}"
    );
}

#[test]
fn extra_allowed_host_with_existing_port_is_not_re_ported() {
    let config = McpConfig {
        allowed_hosts: vec!["unraid.local:1234".to_string()],
        ..McpConfig::default()
    };
    let port = config.port;
    let hosts = allowed_hosts(&config);

    assert!(
        has(&hosts, "unraid.local:1234"),
        "missing extra host:port: {hosts:?}"
    );
    // has_port() short-circuits the extra :<bind-port> suffix.
    assert!(
        !has(&hosts, &format!("unraid.local:1234:{port}")),
        "host:port got an extra bind-port suffix: {hosts:?}"
    );
}

#[test]
fn extra_allowed_origins_are_passed_through() {
    let config = McpConfig {
        allowed_origins: vec!["https://app.example.org".to_string()],
        ..McpConfig::default()
    };
    let origins = allowed_origins(&config);

    assert!(
        has(&origins, "https://app.example.org"),
        "missing extra origin: {origins:?}"
    );
}

// ── 6. allowed_origins reflects the public_url origin ─────────────────────────

#[test]
fn public_url_origin_is_reflected_in_allowed_origins() {
    let mut config = McpConfig::default();
    config.auth.public_url = Some("https://unraid.example.com".to_string());
    let origins = allowed_origins(&config);

    assert!(
        has(&origins, "https://unraid.example.com"),
        "public_url origin not reflected: {origins:?}"
    );
}
