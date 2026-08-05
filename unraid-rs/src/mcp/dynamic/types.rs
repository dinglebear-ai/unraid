//! Validated identifiers and canonical operation paths.

use std::{fmt, str::FromStr, sync::Arc};

use serde::{Deserialize, Deserializer, Serialize, Serializer, de};

/// Error returned when a dynamic MCP identifier is invalid.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("invalid {kind} {value:?}: {reason}")]
pub struct IdentifierError {
    kind: &'static str,
    value: String,
    reason: &'static str,
}

impl IdentifierError {
    fn new(kind: &'static str, value: &str, reason: &'static str) -> Self {
        Self {
            kind,
            value: value.to_string(),
            reason,
        }
    }
}

fn valid_graphql_name(value: &str) -> bool {
    let mut chars = value.chars();
    matches!(chars.next(), Some('_' | 'A'..='Z' | 'a'..='z'))
        && chars.all(|character| matches!(character, '_' | '0'..='9' | 'A'..='Z' | 'a'..='z'))
}

macro_rules! graphql_name {
    ($name:ident, $kind:literal) => {
        #[doc = concat!("Validated ", $kind, ".")]
        #[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
        pub struct $name(Arc<str>);

        impl $name {
            /// Validate and construct the identifier.
            pub fn new(value: impl AsRef<str>) -> Result<Self, IdentifierError> {
                let value = value.as_ref();
                if !valid_graphql_name(value) {
                    return Err(IdentifierError::new(
                        $kind,
                        value,
                        "expected GraphQL name grammar [_A-Za-z][_0-9A-Za-z]*",
                    ));
                }
                Ok(Self(Arc::from(value)))
            }

            /// Return the identifier text.
            pub fn as_str(&self) -> &str {
                &self.0
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str(self.as_str())
            }
        }

        impl FromStr for $name {
            type Err = IdentifierError;

            fn from_str(value: &str) -> Result<Self, Self::Err> {
                Self::new(value)
            }
        }

        impl Serialize for $name {
            fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: Serializer,
            {
                serializer.serialize_str(self.as_str())
            }
        }

        impl<'de> Deserialize<'de> for $name {
            fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
            where
                D: Deserializer<'de>,
            {
                let value = String::deserialize(deserializer)?;
                Self::new(&value).map_err(de::Error::custom)
            }
        }
    };
}

graphql_name!(TypeName, "GraphQL type name");
graphql_name!(FieldName, "GraphQL field name");
graphql_name!(ToolName, "MCP tool name");

/// GraphQL operation category.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OperationKind {
    /// Read operation rooted at the GraphQL Query object.
    Query,
    /// Write operation rooted at the GraphQL Mutation object.
    Mutation,
    /// Streaming operation rooted at the GraphQL Subscription object.
    Subscription,
}

impl OperationKind {
    /// Canonical lower-case path prefix.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Query => "query",
            Self::Mutation => "mutation",
            Self::Subscription => "subscription",
        }
    }
}

impl fmt::Display for OperationKind {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl FromStr for OperationKind {
    type Err = IdentifierError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "query" => Ok(Self::Query),
            "mutation" => Ok(Self::Mutation),
            "subscription" => Ok(Self::Subscription),
            _ => Err(IdentifierError::new(
                "operation kind",
                value,
                "expected query, mutation, or subscription",
            )),
        }
    }
}

/// Stable identity for one GraphQL operation, independent of MCP tool rendering.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OperationPath {
    kind: OperationKind,
    segments: Arc<[FieldName]>,
}

impl OperationPath {
    /// Construct a non-empty canonical operation path.
    pub fn new<I>(kind: OperationKind, segments: I) -> Result<Self, IdentifierError>
    where
        I: IntoIterator<Item = FieldName>,
    {
        let segments: Vec<FieldName> = segments.into_iter().collect();
        if segments.is_empty() {
            return Err(IdentifierError::new(
                "operation path",
                kind.as_str(),
                "at least one field segment is required",
            ));
        }
        Ok(Self {
            kind,
            segments: segments.into(),
        })
    }

    /// Return the operation category.
    pub const fn kind(&self) -> OperationKind {
        self.kind
    }

    /// Return root-to-leaf GraphQL field segments.
    pub fn segments(&self) -> &[FieldName] {
        &self.segments
    }
}

impl fmt::Display for OperationPath {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.kind.as_str())?;
        for segment in self.segments.iter() {
            write!(formatter, ".{segment}")?;
        }
        Ok(())
    }
}

impl FromStr for OperationPath {
    type Err = IdentifierError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let mut parts = value.split('.');
        let kind = parts
            .next()
            .ok_or_else(|| IdentifierError::new("operation path", value, "missing kind"))?
            .parse()?;
        let segments = parts.map(FieldName::new).collect::<Result<Vec<_>, _>>()?;
        Self::new(kind, segments).map_err(|_| {
            IdentifierError::new(
                "operation path",
                value,
                "expected <kind>.<field>[.<field>...]",
            )
        })
    }
}

impl Serialize for OperationPath {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl<'de> Deserialize<'de> for OperationPath {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = String::deserialize(deserializer)?;
        value.parse().map_err(de::Error::custom)
    }
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::{FieldName, OperationKind, OperationPath, ToolName, TypeName};

    #[test]
    fn dynamic_identifiers_accept_graphql_names() {
        assert_eq!(
            TypeName::new("VmMutations").unwrap().as_str(),
            "VmMutations"
        );
        assert_eq!(FieldName::new("start").unwrap().as_str(), "start");
        assert_eq!(
            ToolName::new("unraid_mutation_vm_start").unwrap().as_str(),
            "unraid_mutation_vm_start"
        );
    }

    #[test]
    fn dynamic_identifiers_reject_invalid_names() {
        for invalid in ["", "9lives", "vm-start", "with space", "årray"] {
            assert!(TypeName::new(invalid).is_err(), "accepted {invalid:?}");
            assert!(FieldName::new(invalid).is_err(), "accepted {invalid:?}");
        }
        assert!(ToolName::new("with space").is_err());
    }

    #[test]
    fn dynamic_operation_path_round_trips_canonical_form() {
        let path = OperationPath::new(
            OperationKind::Mutation,
            [
                FieldName::new("vm").unwrap(),
                FieldName::new("start").unwrap(),
            ],
        )
        .unwrap();

        assert_eq!(path.to_string(), "mutation.vm.start");
        assert_eq!(OperationPath::from_str(&path.to_string()).unwrap(), path);
    }

    #[test]
    fn dynamic_operation_path_rejects_empty_and_invalid_paths() {
        assert!(OperationPath::new(OperationKind::Query, []).is_err());
        for invalid in [
            "array",
            "query",
            "query.",
            "write.vm.start",
            "mutation.vm-start",
        ] {
            assert!(
                OperationPath::from_str(invalid).is_err(),
                "accepted {invalid:?}"
            );
        }
    }
}
