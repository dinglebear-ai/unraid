//! Immutable runtime models for dynamic MCP operations.

use super::types::{OperationPath, ToolName};

/// Bootstrap executable metadata for one generated operation.
///
/// Later compiler phases extend this model with arguments, schemas, selections,
/// authorization, risk, and availability metadata.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OperationSpec {
    /// Stable canonical GraphQL identity.
    pub path: OperationPath,
    /// Rendered MCP tool name.
    pub tool_name: ToolName,
}

impl OperationSpec {
    /// Construct bootstrap operation metadata.
    pub fn new(path: OperationPath, tool_name: ToolName) -> Self {
        Self { path, tool_name }
    }
}

#[cfg(test)]
mod tests {
    use super::OperationSpec;

    #[test]
    fn dynamic_operation_spec_type_is_clone_safe() {
        fn assert_clone<T: Clone>() {}
        assert_clone::<OperationSpec>();
    }
}
