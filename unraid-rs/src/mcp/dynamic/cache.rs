//! Last-known-good dynamic schema and catalog cache.

use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use super::{
    catalog::{OperationCatalog, compile_catalog},
    config::DynamicMcpConfig,
    snapshot::{SchemaSnapshot, endpoint_fingerprint},
};

const CACHE_FORMAT_VERSION: u32 = 1;
const COMPILER_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Durable cache envelope containing no credentials or request data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogCacheEnvelope {
    /// On-disk compatibility version.
    pub format_version: u32,
    /// Compiler version that emitted the cache.
    pub compiler_version: String,
    /// Cache creation time.
    pub created_at: DateTime<Utc>,
    /// Credential-free endpoint fingerprint.
    pub endpoint_fingerprint: String,
    /// Complete validated schema snapshot.
    pub snapshot: SchemaSnapshot,
    /// Compiled last-known-good catalog.
    pub catalog: OperationCatalog,
}

/// Cache loading or persistence failure.
#[derive(Debug, thiserror::Error)]
pub enum CacheError {
    #[error("failed to read dynamic schema cache {path}")]
    Read {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to decode dynamic schema cache {path}")]
    Decode {
        path: PathBuf,
        #[source]
        source: serde_json::Error,
    },
    #[error("dynamic schema cache is incompatible: {0}")]
    Incompatible(String),
    #[error("failed to encode dynamic schema cache")]
    Encode(#[source] serde_json::Error),
    #[error("failed to persist dynamic schema cache {path}")]
    Write {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to compile cached schema")]
    Compile(#[source] super::catalog::CatalogError),
    #[error("invalid configured endpoint")]
    Endpoint(#[source] super::snapshot::SnapshotError),
}

/// Atomically persist one validated schema/catalog pair.
pub fn write_cache(
    path: &Path,
    snapshot: &SchemaSnapshot,
    catalog: &OperationCatalog,
) -> Result<(), CacheError> {
    let envelope = CatalogCacheEnvelope {
        format_version: CACHE_FORMAT_VERSION,
        compiler_version: COMPILER_VERSION.to_string(),
        created_at: Utc::now(),
        endpoint_fingerprint: snapshot.endpoint_fingerprint.clone(),
        snapshot: snapshot.clone(),
        catalog: catalog.clone(),
    };
    let bytes = serde_json::to_vec_pretty(&envelope).map_err(CacheError::Encode)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|source| CacheError::Write {
            path: parent.to_path_buf(),
            source,
        })?;
    }
    let temporary = temporary_path(path);
    let mut options = OpenOptions::new();
    options.create(true).truncate(true).write(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(&temporary)
        .map_err(|source| CacheError::Write {
            path: temporary.clone(),
            source,
        })?;
    file.write_all(&bytes).map_err(|source| CacheError::Write {
        path: temporary.clone(),
        source,
    })?;
    file.sync_all().map_err(|source| CacheError::Write {
        path: temporary.clone(),
        source,
    })?;
    fs::rename(&temporary, path).map_err(|source| CacheError::Write {
        path: path.to_path_buf(),
        source,
    })?;
    Ok(())
}

/// Load, validate, and recompile a last-known-good cache for the current policy.
pub fn load_cache(
    path: &Path,
    endpoint: &str,
    config: &DynamicMcpConfig,
) -> Result<Option<(SchemaSnapshot, OperationCatalog)>, CacheError> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(source) => {
            return Err(CacheError::Read {
                path: path.to_path_buf(),
                source,
            });
        }
    };
    let envelope: CatalogCacheEnvelope =
        serde_json::from_slice(&bytes).map_err(|source| CacheError::Decode {
            path: path.to_path_buf(),
            source,
        })?;
    if envelope.format_version != CACHE_FORMAT_VERSION {
        return Err(CacheError::Incompatible(format!(
            "format version {} is not {}",
            envelope.format_version, CACHE_FORMAT_VERSION
        )));
    }
    let expected_endpoint = endpoint_fingerprint(endpoint).map_err(CacheError::Endpoint)?;
    if envelope.endpoint_fingerprint != expected_endpoint
        || envelope.snapshot.endpoint_fingerprint != expected_endpoint
    {
        return Err(CacheError::Incompatible(
            "endpoint fingerprint does not match configured upstream".to_string(),
        ));
    }
    if envelope.catalog.schema_hash != envelope.snapshot.schema_hash {
        return Err(CacheError::Incompatible(
            "catalog schema hash does not match cached snapshot".to_string(),
        ));
    }
    let compiled = compile_catalog(&envelope.snapshot, config).map_err(CacheError::Compile)?;
    if compiled.catalog_hash != envelope.catalog.catalog_hash {
        return Err(CacheError::Incompatible(
            "catalog hash does not match current compiler and policy".to_string(),
        ));
    }
    Ok(Some((envelope.snapshot, compiled)))
}

fn temporary_path(path: &Path) -> PathBuf {
    let mut value = path.as_os_str().to_os_string();
    value.push(format!(".tmp.{}", std::process::id()));
    PathBuf::from(value)
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use chrono::Utc;
    use tempfile::tempdir;

    use crate::mcp::dynamic::{
        catalog::compile_catalog,
        config::DynamicMcpConfig,
        introspection::IntrospectionResponse,
        normalize::normalize_type,
        snapshot::{SchemaRoots, SchemaSnapshot},
        types::TypeName,
    };

    use super::{load_cache, write_cache};

    fn fixture() -> (
        SchemaSnapshot,
        crate::mcp::dynamic::catalog::OperationCatalog,
    ) {
        let response: IntrospectionResponse = serde_json::from_str(include_str!(
            "../../../tests/fixtures/dynamic/minimal-query-types.json"
        ))
        .unwrap();
        let definitions = response
            .data
            .unwrap()
            .aliases
            .into_values()
            .flatten()
            .map(|wire| {
                let name = TypeName::new(wire.name.clone().unwrap()).unwrap();
                (name.clone(), normalize_type(name, wire).unwrap())
            })
            .collect::<BTreeMap<_, _>>();
        let snapshot = SchemaSnapshot::new(
            "https://example.test/graphql",
            Utc::now(),
            SchemaRoots {
                query: TypeName::new("Query").unwrap(),
                mutation: None,
                subscription: None,
            },
            definitions,
        )
        .unwrap();
        let catalog = compile_catalog(&snapshot, &DynamicMcpConfig::default()).unwrap();
        (snapshot, catalog)
    }

    #[test]
    fn dynamic_cache_round_trips_and_rehydrates_registry() {
        let directory = tempdir().unwrap();
        let path = directory.path().join("dynamic.json");
        let (snapshot, catalog) = fixture();
        write_cache(&path, &snapshot, &catalog).unwrap();
        let (_, loaded) = load_cache(
            &path,
            "https://example.test/graphql",
            &DynamicMcpConfig::default(),
        )
        .unwrap()
        .unwrap();
        assert_eq!(loaded.catalog_hash, catalog.catalog_hash);
        assert!(!loaded.registry.types().is_empty());
        let text = std::fs::read_to_string(path).unwrap();
        assert!(!text.contains("api_key"));
        assert!(!text.contains("secret"));
    }

    #[test]
    fn dynamic_cache_rejects_other_endpoint() {
        let directory = tempdir().unwrap();
        let path = directory.path().join("dynamic.json");
        let (snapshot, catalog) = fixture();
        write_cache(&path, &snapshot, &catalog).unwrap();
        assert!(
            load_cache(
                &path,
                "https://other.test/graphql",
                &DynamicMcpConfig::default(),
            )
            .is_err()
        );
    }
}
