//! Deterministic schema snapshots, hashes, and endpoint fingerprints.

use std::collections::BTreeMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use url::Url;

use super::{schema::TypeDefinition, types::TypeName};

/// Named GraphQL operation roots included in one snapshot.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SchemaRoots {
    /// Required query root.
    pub query: TypeName,
    /// Optional mutation root.
    pub mutation: Option<TypeName>,
    /// Optional subscription root.
    pub subscription: Option<TypeName>,
}

/// Complete immutable result of one successful schema discovery.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SchemaSnapshot {
    /// Capture time, excluded from the schema hash.
    pub captured_at: DateTime<Utc>,
    /// Credential-free fingerprint of the configured endpoint.
    pub endpoint_fingerprint: String,
    /// Validated operation roots.
    pub roots: SchemaRoots,
    /// Complete reachable normalized type graph.
    pub types: BTreeMap<TypeName, TypeDefinition>,
    /// Hash of roots and normalized types only.
    pub schema_hash: String,
}

impl SchemaSnapshot {
    /// Build a deterministic snapshot from normalized schema data.
    pub fn new(
        endpoint: &str,
        captured_at: DateTime<Utc>,
        roots: SchemaRoots,
        types: BTreeMap<TypeName, TypeDefinition>,
    ) -> Result<Self, SnapshotError> {
        let endpoint_fingerprint = endpoint_fingerprint(endpoint)?;
        let schema_hash = schema_hash(&roots, &types)?;
        Ok(Self {
            captured_at,
            endpoint_fingerprint,
            roots,
            types,
            schema_hash,
        })
    }
}

/// Snapshot construction failure.
#[derive(Debug, thiserror::Error)]
pub enum SnapshotError {
    /// The configured endpoint is not a valid absolute URL.
    #[error("invalid GraphQL endpoint URL")]
    InvalidEndpoint(#[source] url::ParseError),
    /// Canonical schema serialization failed.
    #[error("failed to serialize canonical schema")]
    Serialization(#[source] serde_json::Error),
}

/// Compute the schema identity from roots and normalized definitions.
pub fn schema_hash(
    roots: &SchemaRoots,
    types: &BTreeMap<TypeName, TypeDefinition>,
) -> Result<String, SnapshotError> {
    #[derive(Serialize)]
    struct CanonicalSchema<'a> {
        roots: &'a SchemaRoots,
        types: &'a BTreeMap<TypeName, TypeDefinition>,
    }

    let bytes = serde_json::to_vec(&CanonicalSchema { roots, types })
        .map_err(SnapshotError::Serialization)?;
    Ok(prefixed_sha256(&bytes))
}

/// Compute a credential-free fingerprint for one GraphQL endpoint.
pub fn endpoint_fingerprint(endpoint: &str) -> Result<String, SnapshotError> {
    let mut url = Url::parse(endpoint).map_err(SnapshotError::InvalidEndpoint)?;
    let _ = url.set_username("");
    let _ = url.set_password(None);
    url.set_query(None);
    url.set_fragment(None);
    Ok(prefixed_sha256(url.as_str().as_bytes()))
}

fn prefixed_sha256(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    format!("sha256:{}", hex::encode(digest))
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use chrono::{TimeZone, Utc};

    use crate::mcp::dynamic::{
        introspection::IntrospectionResponse, normalize::normalize_type, types::TypeName,
    };

    use super::{SchemaRoots, SchemaSnapshot, endpoint_fingerprint, schema_hash};

    const FIXTURE: &str = include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json");

    fn definitions(
        reverse: bool,
    ) -> BTreeMap<TypeName, crate::mcp::dynamic::schema::TypeDefinition> {
        let response: IntrospectionResponse = serde_json::from_str(FIXTURE).unwrap();
        let mut wires = response
            .data
            .unwrap()
            .aliases
            .into_values()
            .flatten()
            .collect::<Vec<_>>();
        if reverse {
            wires.reverse();
        }
        wires
            .into_iter()
            .map(|wire| {
                let name = TypeName::new(wire.name.clone().unwrap()).unwrap();
                let definition = normalize_type(name.clone(), wire).unwrap();
                (name, definition)
            })
            .collect()
    }

    fn roots() -> SchemaRoots {
        SchemaRoots {
            query: TypeName::new("Query").unwrap(),
            mutation: None,
            subscription: None,
        }
    }

    #[test]
    fn dynamic_schema_hash_ignores_source_order_and_timestamp() {
        let first_types = definitions(false);
        let second_types = definitions(true);
        assert_eq!(
            schema_hash(&roots(), &first_types).unwrap(),
            schema_hash(&roots(), &second_types).unwrap()
        );

        let first = SchemaSnapshot::new(
            "https://user:secret@example.test/graphql?token=x#frag",
            Utc.timestamp_opt(1, 0).unwrap(),
            roots(),
            first_types,
        )
        .unwrap();
        let second = SchemaSnapshot::new(
            "https://example.test/graphql",
            Utc.timestamp_opt(2, 0).unwrap(),
            roots(),
            second_types,
        )
        .unwrap();
        assert_eq!(first.schema_hash, second.schema_hash);
        assert_eq!(first.endpoint_fingerprint, second.endpoint_fingerprint);
        assert_ne!(first.captured_at, second.captured_at);
    }

    #[test]
    fn dynamic_schema_hash_changes_when_description_changes() {
        let first = definitions(false);
        let mut second = first.clone();
        let query = second.get_mut(&TypeName::new("Query").unwrap()).unwrap();
        if let crate::mcp::dynamic::schema::TypeDefinition::Object(query) = query {
            query.description = Some("changed".to_string());
        }
        assert_ne!(
            schema_hash(&roots(), &first).unwrap(),
            schema_hash(&roots(), &second).unwrap()
        );
    }

    #[test]
    fn dynamic_endpoint_fingerprint_uses_host_port_and_path_not_credentials() {
        let first =
            endpoint_fingerprint("https://alice:one@example.test:31337/graphql?q=x").unwrap();
        let second = endpoint_fingerprint("https://bob:two@example.test:31337/graphql#x").unwrap();
        let other_path = endpoint_fingerprint("https://example.test:31337/other").unwrap();
        assert_eq!(first, second);
        assert_ne!(first, other_path);
    }
}
