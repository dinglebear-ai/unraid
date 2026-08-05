//! Deterministic MCP and GraphQL operation naming.

use super::types::{OperationPath, ToolName};

/// Convert a GraphQL identifier into deterministic snake case.
pub fn snake_case(value: &str) -> String {
    let chars = value.chars().collect::<Vec<_>>();
    let mut output = String::with_capacity(value.len() + 4);
    for (index, character) in chars.iter().copied().enumerate() {
        if character.is_ascii_uppercase() {
            let previous = index.checked_sub(1).and_then(|i| chars.get(i)).copied();
            let next = chars.get(index + 1).copied();
            let boundary = index > 0
                && (previous.is_some_and(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
                    || next.is_some_and(|c| c.is_ascii_lowercase()));
            if boundary && !output.ends_with('_') {
                output.push('_');
            }
            output.push(character.to_ascii_lowercase());
        } else if character.is_ascii_alphanumeric() || character == '_' {
            output.push(character.to_ascii_lowercase());
        }
    }
    output
}

/// Render the default generated MCP tool name.
pub fn tool_name(path: &OperationPath) -> ToolName {
    let suffix = path
        .segments()
        .iter()
        .map(|segment| snake_case(segment.as_str()))
        .collect::<Vec<_>>()
        .join("_");
    ToolName::new(format!("unraid_{}_{}", path.kind().as_str(), suffix))
        .expect("generated tool names use GraphQL-safe characters")
}

/// Render a GraphQL operation name from the generated tool name.
pub fn operation_name(path: &OperationPath) -> String {
    tool_name(path).to_string()
}

/// Render a compact human-readable title.
pub fn title(path: &OperationPath) -> String {
    let action = path
        .segments()
        .iter()
        .map(|segment| snake_case(segment.as_str()).replace('_', " "))
        .collect::<Vec<_>>()
        .join(" / ");
    format!("Unraid {}: {action}", path.kind().as_str())
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::{operation_name, snake_case, title, tool_name};
    use crate::mcp::dynamic::types::OperationPath;

    #[test]
    fn dynamic_naming_converts_graphql_case_deterministically() {
        assert_eq!(snake_case("vmStart"), "vm_start");
        assert_eq!(snake_case("URLType"), "url_type");
        assert_eq!(snake_case("UPSConfig"), "ups_config");
        assert_eq!(snake_case("already_snake"), "already_snake");
    }

    #[test]
    fn dynamic_naming_renders_canonical_tool_and_operation_names() {
        let path = OperationPath::from_str("mutation.vm.forceStop").unwrap();
        assert_eq!(tool_name(&path).as_str(), "unraid_mutation_vm_force_stop");
        assert_eq!(operation_name(&path), "unraid_mutation_vm_force_stop");
        assert_eq!(title(&path), "Unraid mutation: vm / force stop");
    }
}
