use std::net::Ipv6Addr;

use crate::config::McpConfig;

/// Compute the set of allowed `Host` header values for the MCP server.
pub(crate) fn allowed_hosts(config: &McpConfig) -> Vec<String> {
    let mut hosts = vec!["localhost".to_string(), "127.0.0.1".to_string()];
    push_host_variants(&mut hosts, &config.host, config.port);
    push_host_variants(&mut hosts, "localhost", config.port);
    push_host_variants(&mut hosts, "127.0.0.1", config.port);
    push_host_variants(&mut hosts, "::1", config.port);
    for host in &config.allowed_hosts {
        push_host_variants(&mut hosts, host, config.port);
    }
    if let Some(public_url) = config.auth.public_url.as_deref() {
        push_public_url_hosts(&mut hosts, public_url, config.port);
    }
    hosts.sort();
    hosts.dedup();
    hosts
}

/// Compute the set of allowed CORS origins for the MCP server.
pub(crate) fn allowed_origins(config: &McpConfig) -> Vec<String> {
    let mut origins = vec![
        format!("http://localhost:{}", config.port),
        format!("http://127.0.0.1:{}", config.port),
    ];
    origins.extend(config.allowed_origins.iter().cloned());
    if let Some(public_url) = config.auth.public_url.as_deref() {
        if let Some(origin) = extract_origin(public_url) {
            origins.push(origin);
        }
    }
    origins.sort();
    origins.dedup();
    origins
}

fn push_host_variants(hosts: &mut Vec<String>, host: &str, port: u16) {
    let host = host.trim();
    if host.is_empty() {
        return;
    }
    hosts.push(host.to_string());
    if host.starts_with('[') && host.contains("]:") {
        return;
    }
    if let Some(inner) = host.strip_prefix('[').and_then(|v| v.strip_suffix(']')) {
        if !inner.is_empty() {
            hosts.push(format!("[{inner}]:{port}"));
        }
    } else if host.parse::<Ipv6Addr>().is_ok() {
        hosts.push(format!("[{host}]"));
        hosts.push(format!("[{host}]:{port}"));
    } else if !has_port(host) {
        hosts.push(format!("{host}:{port}"));
    }
}

fn push_public_url_hosts(hosts: &mut Vec<String>, url: &str, listen_port: u16) {
    let Ok(parsed) = url::Url::parse(url) else {
        tracing::warn!(
            public_url = url,
            "UNRAID_RMCP_PUBLIC_URL is not a valid URL"
        );
        return;
    };
    let Some(host) = parsed.host_str() else {
        return;
    };
    if host.contains('*') {
        tracing::warn!(
            host,
            "UNRAID_RMCP_PUBLIC_URL host contains wildcard; skipping"
        );
        return;
    }
    let explicit_port = parsed.port();
    let scheme_default = match parsed.scheme() {
        "https" => Some(443u16),
        "http" => Some(80u16),
        _ => None,
    };
    if let Some(p) = explicit_port {
        push_host_variants(hosts, host, p);
        let with_port = format!("{host}:{p}");
        if !hosts.contains(&with_port) {
            hosts.push(with_port);
        }
    } else if let Some(default_port) = scheme_default {
        let bare = host.to_string();
        if !hosts.contains(&bare) {
            hosts.push(bare);
        }
        let with_default = format!("{host}:{default_port}");
        if !hosts.contains(&with_default) {
            hosts.push(with_default);
        }
    } else {
        push_host_variants(hosts, host, listen_port);
    }
}

fn has_port(host: &str) -> bool {
    host.rsplit_once(':')
        .and_then(|(_, p)| p.parse::<u16>().ok())
        .is_some()
}

fn extract_origin(url: &str) -> Option<String> {
    let parsed = url::Url::parse(url)
        .map_err(|e| tracing::warn!(public_url = url, error = %e, "invalid UNRAID_RMCP_PUBLIC_URL"))
        .ok()?;
    let scheme = parsed.scheme();
    let host = parsed.host_str()?;
    if host.contains('*') {
        return None;
    }
    let default_port = match scheme {
        "http" => Some(80u16),
        "https" => Some(443u16),
        _ => None,
    };
    let origin = match parsed.port() {
        Some(port) if default_port != Some(port) => format!("{scheme}://{host}:{port}"),
        _ => format!("{scheme}://{host}"),
    };
    Some(origin)
}
