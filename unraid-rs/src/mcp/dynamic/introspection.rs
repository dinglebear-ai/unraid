//! GraphQL introspection wire models and targeted type-query construction.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use super::types::{TypeName, TypeRef};

const MAX_TYPE_REF_DEPTH: usize = 32;

/// Errors produced while parsing or building targeted introspection requests.
#[derive(Debug, thiserror::Error)]
pub enum DiscoveryError {
    /// A targeted batch must contain at least one type.
    #[error("targeted introspection batch must not be empty")]
    EmptyBatch,
    /// The upstream type-reference structure is invalid.
    #[error("invalid introspection type reference: {0}")]
    InvalidTypeRef(String),
    /// The recursive wrapper depth exceeded the defensive bound.
    #[error("introspection type reference exceeds maximum depth {MAX_TYPE_REF_DEPTH}")]
    TypeRefDepthExceeded,
    /// The canonical GraphQL transport rejected the request.
    #[error("upstream dynamic introspection request failed")]
    Upstream(#[source] anyhow::Error),
    /// The upstream returned data that cannot form a complete batch.
    #[error("invalid targeted introspection response: {0}")]
    InvalidResponse(String),
    /// A named schema definition is internally inconsistent.
    #[error("invalid GraphQL type definition: {0}")]
    InvalidDefinition(String),
    /// A bounded discovery limit was exceeded.
    #[error("schema discovery limit {limit} exceeded: observed {observed}")]
    LimitExceeded {
        /// Name of the configured limit.
        limit: &'static str,
        /// Observed value that exceeded the limit.
        observed: usize,
    },
    /// A targeted introspection request exceeded its configured timeout.
    #[error("targeted introspection request timed out")]
    Timeout,
    /// Deterministic snapshot construction failed.
    #[error(transparent)]
    Snapshot(#[from] super::snapshot::SnapshotError),
}

/// GraphQL introspection type category.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TypeKind {
    /// Scalar type.
    Scalar,
    /// Object type.
    Object,
    /// Interface type.
    Interface,
    /// Union type.
    Union,
    /// Enum type.
    Enum,
    /// Input-object type.
    InputObject,
    /// List wrapper used only in type references.
    List,
    /// Non-null wrapper used only in type references.
    NonNull,
}

impl TypeKind {
    fn is_named(self) -> bool {
        !matches!(self, Self::List | Self::NonNull)
    }
}

/// Recursive introspection type reference.
#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IntrospectionTypeRef {
    /// Type or wrapper category.
    pub kind: TypeKind,
    /// Named type name; absent for wrappers.
    pub name: Option<String>,
    /// Wrapped type; present only for list and non-null wrappers.
    pub of_type: Option<Box<IntrospectionTypeRef>>,
}

impl TryFrom<IntrospectionTypeRef> for TypeRef {
    type Error = DiscoveryError;

    fn try_from(value: IntrospectionTypeRef) -> Result<Self, Self::Error> {
        convert_type_ref(value, 0, false)
    }
}

fn convert_type_ref(
    value: IntrospectionTypeRef,
    depth: usize,
    parent_non_null: bool,
) -> Result<TypeRef, DiscoveryError> {
    if depth > MAX_TYPE_REF_DEPTH {
        return Err(DiscoveryError::TypeRefDepthExceeded);
    }

    if value.kind.is_named() {
        if value.of_type.is_some() {
            return Err(DiscoveryError::InvalidTypeRef(
                "named type unexpectedly contains ofType".to_string(),
            ));
        }
        let name = value.name.ok_or_else(|| {
            DiscoveryError::InvalidTypeRef("named type is missing name".to_string())
        })?;
        return TypeName::new(&name)
            .map(TypeRef::Named)
            .map_err(|error| DiscoveryError::InvalidTypeRef(error.to_string()));
    }

    if value.name.is_some() {
        return Err(DiscoveryError::InvalidTypeRef(
            "wrapper type unexpectedly contains name".to_string(),
        ));
    }
    let inner = *value.of_type.ok_or_else(|| {
        DiscoveryError::InvalidTypeRef("wrapper type is missing ofType".to_string())
    })?;

    match value.kind {
        TypeKind::List => convert_type_ref(inner, depth + 1, false)
            .map(Box::new)
            .map(TypeRef::List),
        TypeKind::NonNull if parent_non_null || inner.kind == TypeKind::NonNull => Err(
            DiscoveryError::InvalidTypeRef("nested non-null wrappers are invalid".to_string()),
        ),
        TypeKind::NonNull => convert_type_ref(inner, depth + 1, true)
            .map(Box::new)
            .map(TypeRef::NonNull),
        _ => unreachable!("named kinds returned above"),
    }
}

/// One named type reference from interfaces or possible types.
#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IntrospectionNamedType {
    /// Type category.
    pub kind: TypeKind,
    /// GraphQL type name.
    pub name: Option<String>,
}

/// One field argument or input-object field.
#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IntrospectionInputValue {
    /// GraphQL argument or input-field name.
    pub name: String,
    /// Human-readable description.
    pub description: Option<String>,
    /// GraphQL default literal.
    pub default_value: Option<String>,
    /// Whether this input is deprecated.
    #[serde(default)]
    pub is_deprecated: bool,
    /// Optional deprecation reason.
    pub deprecation_reason: Option<String>,
    /// Input type reference.
    #[serde(rename = "type")]
    pub ty: IntrospectionTypeRef,
}

/// One output field from an object or interface type.
#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IntrospectionField {
    /// GraphQL field name.
    pub name: String,
    /// Human-readable description.
    pub description: Option<String>,
    /// Field arguments.
    #[serde(default)]
    pub args: Vec<IntrospectionInputValue>,
    /// Return type reference.
    #[serde(rename = "type")]
    pub ty: IntrospectionTypeRef,
    /// Whether this field is deprecated.
    #[serde(default)]
    pub is_deprecated: bool,
    /// Optional deprecation reason.
    pub deprecation_reason: Option<String>,
}

/// One enum value returned by introspection.
#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IntrospectionEnumValue {
    /// Enum value name.
    pub name: String,
    /// Human-readable description.
    pub description: Option<String>,
    /// Whether this value is deprecated.
    #[serde(default)]
    pub is_deprecated: bool,
    /// Optional deprecation reason.
    pub deprecation_reason: Option<String>,
}

/// One complete named GraphQL type returned by a targeted request.
#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct IntrospectionType {
    /// Type category.
    pub kind: TypeKind,
    /// Type name.
    pub name: Option<String>,
    /// Human-readable description.
    pub description: Option<String>,
    /// Optional custom-scalar specification URL.
    pub specified_by_url: Option<String>,
    /// Object or interface fields.
    pub fields: Option<Vec<IntrospectionField>>,
    /// Input-object fields.
    pub input_fields: Option<Vec<IntrospectionInputValue>>,
    /// Implemented interfaces.
    pub interfaces: Option<Vec<IntrospectionNamedType>>,
    /// Enum values.
    pub enum_values: Option<Vec<IntrospectionEnumValue>>,
    /// Union or interface possible types.
    pub possible_types: Option<Vec<IntrospectionNamedType>>,
}

/// Aliased response data for one targeted batch.
#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct IntrospectionData {
    /// Alias-to-type response map.
    #[serde(flatten)]
    pub aliases: BTreeMap<String, Option<IntrospectionType>>,
}

/// One GraphQL error returned by the upstream.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct IntrospectionError {
    /// Upstream message used only for discovery classification.
    pub message: String,
    /// Optional GraphQL error extensions.
    #[serde(default)]
    pub extensions: Map<String, Value>,
}

/// Top-level targeted introspection response.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct IntrospectionResponse {
    /// Successful aliased response data.
    pub data: Option<IntrospectionData>,
    /// GraphQL errors, if any.
    #[serde(default)]
    pub errors: Vec<IntrospectionError>,
}

/// Deterministic GraphQL request for one sorted set of type names.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeBatchRequest {
    /// Complete GraphQL document.
    pub document: String,
    /// Variable values keyed by n0, n1, and so on.
    pub variables: Map<String, Value>,
    /// Alias mapping keyed by t0, t1, and so on.
    pub aliases: BTreeMap<String, TypeName>,
}

/// Build a deterministic, variable-only batched type request.
pub fn build_type_batch(names: &[TypeName]) -> Result<TypeBatchRequest, DiscoveryError> {
    if names.is_empty() {
        return Err(DiscoveryError::EmptyBatch);
    }

    let mut sorted = names.to_vec();
    sorted.sort();
    sorted.dedup();

    let variable_definitions = sorted
        .iter()
        .enumerate()
        .map(|(index, _)| format!("$n{index}: String!"))
        .collect::<Vec<_>>()
        .join(", ");
    let selections = sorted
        .iter()
        .enumerate()
        .map(|(index, _)| format!("  t{index}: __type(name: $n{index}) {{ ...TypeDefinition }}"))
        .collect::<Vec<_>>()
        .join(
            "
",
        );

    let document = format!(
        "query DynamicTypes({variable_definitions}) {{
{selections}
}}

{TYPE_DEFINITION_FRAGMENT}

{TYPE_REF_FRAGMENT}
"
    );
    let mut variables = Map::new();
    let mut aliases = BTreeMap::new();
    for (index, name) in sorted.into_iter().enumerate() {
        variables.insert(format!("n{index}"), Value::String(name.to_string()));
        aliases.insert(format!("t{index}"), name);
    }

    Ok(TypeBatchRequest {
        document,
        variables,
        aliases,
    })
}

const TYPE_DEFINITION_FRAGMENT: &str = r#"fragment TypeDefinition on __Type {
  kind
  name
  description
  specifiedByURL
  fields(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
    args(includeDeprecated: true) {
      name
      description
      defaultValue
      isDeprecated
      deprecationReason
      type { ...TypeRef }
    }
    type { ...TypeRef }
  }
  inputFields(includeDeprecated: true) {
    name
    description
    defaultValue
    isDeprecated
    deprecationReason
    type { ...TypeRef }
  }
  interfaces { kind name }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes { kind name }
}"#;

const TYPE_REF_FRAGMENT: &str = r#"fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType { kind name }
        }
      }
    }
  }
}"#;

#[cfg(test)]
mod tests {
    use std::collections::BTreeSet;

    use serde_json::json;

    use crate::mcp::dynamic::types::{TypeName, TypeRef};

    use super::{IntrospectionResponse, IntrospectionTypeRef, TypeKind, build_type_batch};

    const MINIMAL_QUERY_TYPES: &str =
        include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json");
    const NAMESPACE_MUTATIONS: &str =
        include_str!("../../../tests/fixtures/dynamic/namespace-mutations.json");

    #[test]
    fn dynamic_introspection_deserialize_minimal_query_types() {
        let response: IntrospectionResponse =
            serde_json::from_str(MINIMAL_QUERY_TYPES).expect("valid query fixture");
        assert!(response.errors.is_empty());
        let data = response.data.expect("fixture data");
        assert_eq!(data.aliases.len(), 4);
        assert_eq!(
            data.aliases["t0"].as_ref().unwrap().name.as_deref(),
            Some("Query")
        );
        assert_eq!(data.aliases["t0"].as_ref().unwrap().kind, TypeKind::Object);
    }

    #[test]
    fn dynamic_introspection_deserialize_namespace_mutations() {
        let response: IntrospectionResponse =
            serde_json::from_str(NAMESPACE_MUTATIONS).expect("valid mutation fixture");
        let data = response.data.expect("fixture data");
        let names = data
            .aliases
            .values()
            .flatten()
            .filter_map(|ty| ty.name.as_deref())
            .collect::<BTreeSet<_>>();
        assert!(names.contains("Mutation"));
        assert!(names.contains("VmMutations"));
    }

    #[test]
    fn dynamic_type_ref_converts_wrappers_and_round_trips_graphql() {
        let string_non_null: IntrospectionTypeRef = serde_json::from_value(json!({
            "kind": "NON_NULL",
            "name": null,
            "ofType": { "kind": "SCALAR", "name": "String", "ofType": null }
        }))
        .unwrap();
        let list_non_null: IntrospectionTypeRef = serde_json::from_value(json!({
            "kind": "NON_NULL",
            "name": null,
            "ofType": {
                "kind": "LIST",
                "name": null,
                "ofType": {
                    "kind": "NON_NULL",
                    "name": null,
                    "ofType": { "kind": "SCALAR", "name": "String", "ofType": null }
                }
            }
        }))
        .unwrap();

        let string_ty = TypeRef::try_from(string_non_null).unwrap();
        let list_ty = TypeRef::try_from(list_non_null).unwrap();
        assert_eq!(string_ty.to_graphql(), "String!");
        assert_eq!(list_ty.to_graphql(), "[String!]!");
        assert_eq!(string_ty.named_type().as_str(), "String");
    }

    #[test]
    fn dynamic_type_ref_rejects_malformed_wrappers() {
        for malformed in [
            json!({ "kind": "LIST", "name": null, "ofType": null }),
            json!({ "kind": "SCALAR", "name": null, "ofType": null }),
            json!({
                "kind": "SCALAR",
                "name": "String",
                "ofType": { "kind": "SCALAR", "name": "Boolean", "ofType": null }
            }),
            json!({
                "kind": "NON_NULL",
                "name": null,
                "ofType": {
                    "kind": "NON_NULL",
                    "name": null,
                    "ofType": { "kind": "SCALAR", "name": "String", "ofType": null }
                }
            }),
        ] {
            let wire: IntrospectionTypeRef = serde_json::from_value(malformed).unwrap();
            assert!(TypeRef::try_from(wire).is_err());
        }
    }

    #[test]
    fn dynamic_type_batch_is_sorted_variable_driven_and_deterministic() {
        let names = [
            TypeName::new("VmMutations").unwrap(),
            TypeName::new("Mutation").unwrap(),
        ];
        let first = build_type_batch(&names).unwrap();
        let second = build_type_batch(&[names[1].clone(), names[0].clone()]).unwrap();

        assert_eq!(first, second);
        assert_eq!(first.aliases["t0"].as_str(), "Mutation");
        assert_eq!(first.aliases["t1"].as_str(), "VmMutations");
        assert_eq!(first.variables["n0"], json!("Mutation"));
        assert_eq!(first.variables["n1"], json!("VmMutations"));
        assert!(first.document.contains("t0: __type(name: $n0)"));
        assert!(first.document.contains("t1: __type(name: $n1)"));
        assert!(!first.document.contains("VmMutations"));
        assert!(!first.document.contains("__schema"));
    }

    #[test]
    fn dynamic_type_batch_rejects_empty_input() {
        assert!(build_type_batch(&[]).is_err());
    }
}
