//! Immutable compiled operation models.

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use super::{
    schema::InputValue,
    selection::SelectionPlan,
    types::{FieldName, OperationKind, OperationPath, ToolName, TypeName, TypeRef},
};

/// One GraphQL field from operation root to callable leaf.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OperationSegment {
    /// Field selected at this level.
    pub field: FieldName,
    /// Parent object type containing the field.
    pub parent_type: TypeName,
    /// Return type of the field.
    pub return_type: TypeRef,
}

/// Coarse MCP authorization scope required by a generated operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RequiredScope {
    /// Read-only query scope.
    Read,
    /// Administrative mutation scope.
    Admin,
}

/// Risk metadata exposed as MCP annotations and elicitation prose.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
pub struct RiskMetadata {
    /// Operator override marking especially destructive behavior.
    pub destructive: bool,
    /// Optional human-readable risk reason.
    pub reason: Option<String>,
}

/// Compiled operation availability.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OperationAvailability {
    /// Operation is advertised and callable.
    Available,
    /// Operation is valid but disabled by policy.
    DisabledByPolicy,
    /// Operation is retained for diagnostics but cannot execute safely.
    Unsupported {
        /// Stable diagnostic explanation.
        detail: String,
    },
    /// Operation is omitted from all public surfaces.
    Hidden,
}

impl OperationAvailability {
    /// Whether this operation should be indexed by generated tool name.
    pub const fn is_available(&self) -> bool {
        matches!(self, Self::Available)
    }
}

/// Complete immutable executable definition for one generated operation.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OperationSpec {
    /// Stable canonical GraphQL path.
    pub path: OperationPath,
    /// Generated MCP tool name.
    pub tool_name: ToolName,
    /// Generated GraphQL operation name.
    pub operation_name: String,
    /// Human-readable display title.
    pub title: String,
    /// Human-readable operation description.
    pub description: String,
    /// Root-to-leaf GraphQL segments.
    pub segments: Vec<OperationSegment>,
    /// Leaf operation arguments.
    pub arguments: Vec<InputValue>,
    /// Leaf return type.
    pub return_type: TypeRef,
    /// MCP input JSON Schema.
    pub input_schema: Arc<Map<String, Value>>,
    /// MCP output JSON Schema.
    pub output_schema: Arc<Map<String, Value>>,
    /// Default bounded response selection.
    pub default_selection: SelectionPlan,
    /// Required coarse scope.
    pub scope: RequiredScope,
    /// Risk and annotation metadata.
    pub risk: RiskMetadata,
    /// Compiled policy/compatibility state.
    pub availability: OperationAvailability,
}

impl OperationSpec {
    /// Return the operation category from its canonical path.
    pub const fn kind(&self) -> OperationKind {
        self.path.kind()
    }

    /// Every generated mutation requires native MCP form elicitation.
    pub const fn requires_elicitation(&self) -> bool {
        matches!(self.path.kind(), OperationKind::Mutation)
    }
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::OperationAvailability;
    use crate::mcp::dynamic::types::OperationPath;

    #[test]
    fn dynamic_operation_kind_structurally_controls_elicitation() {
        assert!(matches!(
            OperationPath::from_str("mutation.vm.start").unwrap().kind(),
            crate::mcp::dynamic::types::OperationKind::Mutation
        ));
        assert!(OperationAvailability::Available.is_available());
        assert!(!OperationAvailability::DisabledByPolicy.is_available());
    }
}
