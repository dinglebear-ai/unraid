//! Catalog-aware validation for generated MCP tool arguments.

use std::collections::BTreeMap;

use serde_json::{Map, Value};

use super::{
    config::DynamicMcpConfig,
    schema::{InputValue, TypeDefinition, TypeRegistry},
    types::TypeRef,
};

/// Caller-correctable generated-tool argument failure.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum ValidationError {
    #[error("unknown argument {0}")]
    UnknownArgument(String),
    #[error("missing required argument {0}")]
    MissingArgument(String),
    #[error("invalid value at {path}: {reason}")]
    InvalidValue { path: String, reason: String },
    #[error("input exceeds maximum depth {0}")]
    InputDepth(usize),
    #[error("argument payload exceeds maximum size {0} bytes")]
    ArgumentBytes(usize),
}

/// Validate one generated operation's arguments against the normalized schema.
pub fn validate_arguments(
    arguments: &[InputValue],
    values: &Map<String, Value>,
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
) -> Result<(), ValidationError> {
    let bytes = serde_json::to_vec(values)
        .map_err(|error| ValidationError::InvalidValue {
            path: "$".to_string(),
            reason: error.to_string(),
        })?
        .len();
    if bytes > config.max_argument_bytes {
        return Err(ValidationError::ArgumentBytes(config.max_argument_bytes));
    }
    let by_name = arguments
        .iter()
        .map(|argument| (argument.name.as_str(), argument))
        .collect::<BTreeMap<_, _>>();
    for name in values.keys() {
        if name != "select" && !by_name.contains_key(name.as_str()) {
            return Err(ValidationError::UnknownArgument(name.clone()));
        }
    }
    for argument in arguments {
        let value = values.get(argument.name.as_str());
        if value.is_none()
            && matches!(argument.ty, TypeRef::NonNull(_))
            && argument.default_literal.is_none()
        {
            return Err(ValidationError::MissingArgument(argument.name.to_string()));
        }
        if let Some(value) = value {
            validate_value(
                &argument.ty,
                value,
                registry,
                config,
                0,
                &argument.name.to_string(),
            )?;
        }
    }
    if let Some(select) = values.get("select") {
        let paths = select
            .as_array()
            .ok_or_else(|| ValidationError::InvalidValue {
                path: "select".to_string(),
                reason: "expected an array of strings".to_string(),
            })?;
        if paths.len() > config.max_selected_fields {
            return Err(ValidationError::InvalidValue {
                path: "select".to_string(),
                reason: format!("at most {} paths are allowed", config.max_selected_fields),
            });
        }
        for (index, value) in paths.iter().enumerate() {
            if value.as_str().is_none_or(str::is_empty) {
                return Err(ValidationError::InvalidValue {
                    path: format!("select[{index}]"),
                    reason: "expected a non-empty string".to_string(),
                });
            }
        }
    }
    Ok(())
}

fn validate_value(
    ty: &TypeRef,
    value: &Value,
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
    depth: usize,
    path: &str,
) -> Result<(), ValidationError> {
    if depth > config.max_input_depth {
        return Err(ValidationError::InputDepth(config.max_input_depth));
    }
    match ty {
        TypeRef::NonNull(_) if value.is_null() => Err(ValidationError::InvalidValue {
            path: path.to_string(),
            reason: "null is not allowed".to_string(),
        }),
        TypeRef::NonNull(inner) => validate_value(inner, value, registry, config, depth, path),
        _ if value.is_null() => Ok(()),
        TypeRef::List(inner) => {
            let values = value
                .as_array()
                .ok_or_else(|| ValidationError::InvalidValue {
                    path: path.to_string(),
                    reason: "expected an array".to_string(),
                })?;
            if values.len() > config.max_array_items {
                return Err(ValidationError::InvalidValue {
                    path: path.to_string(),
                    reason: format!("at most {} array items are allowed", config.max_array_items),
                });
            }
            for (index, value) in values.iter().enumerate() {
                validate_value(
                    inner,
                    value,
                    registry,
                    config,
                    depth + 1,
                    &format!("{path}[{index}]"),
                )?;
            }
            Ok(())
        }
        TypeRef::Named(name) => {
            let definition = registry
                .require(name)
                .map_err(|_| ValidationError::InvalidValue {
                    path: path.to_string(),
                    reason: format!("schema type {name} is missing"),
                })?;
            match definition {
                TypeDefinition::Scalar(_) => validate_scalar(name.as_str(), value, path),
                TypeDefinition::Enum(enum_type) => {
                    let value = value
                        .as_str()
                        .ok_or_else(|| ValidationError::InvalidValue {
                            path: path.to_string(),
                            reason: "expected an enum string".to_string(),
                        })?;
                    if enum_type
                        .values
                        .iter()
                        .any(|item| item.name.as_str() == value)
                    {
                        Ok(())
                    } else {
                        Err(ValidationError::InvalidValue {
                            path: path.to_string(),
                            reason: format!("unknown enum value {value:?}"),
                        })
                    }
                }
                TypeDefinition::InputObject(input) => {
                    let object =
                        value
                            .as_object()
                            .ok_or_else(|| ValidationError::InvalidValue {
                                path: path.to_string(),
                                reason: "expected an object".to_string(),
                            })?;
                    let by_name = input
                        .fields
                        .iter()
                        .map(|field| (field.name.as_str(), field))
                        .collect::<BTreeMap<_, _>>();
                    for name in object.keys() {
                        if !by_name.contains_key(name.as_str()) {
                            return Err(ValidationError::UnknownArgument(format!("{path}.{name}")));
                        }
                    }
                    for field in &input.fields {
                        let child_path = format!("{path}.{}", field.name);
                        match object.get(field.name.as_str()) {
                            Some(value) => validate_value(
                                &field.ty,
                                value,
                                registry,
                                config,
                                depth + 1,
                                &child_path,
                            )?,
                            None if matches!(field.ty, TypeRef::NonNull(_))
                                && field.default_literal.is_none() =>
                            {
                                return Err(ValidationError::MissingArgument(child_path));
                            }
                            None => {}
                        }
                    }
                    Ok(())
                }
                _ => Err(ValidationError::InvalidValue {
                    path: path.to_string(),
                    reason: format!("{name} is not an input type"),
                }),
            }
        }
    }
}

fn validate_scalar(name: &str, value: &Value, path: &str) -> Result<(), ValidationError> {
    let valid = match name {
        "String" | "PrefixedID" => value.is_string(),
        "Boolean" => value.is_boolean(),
        "Int" => value
            .as_i64()
            .is_some_and(|number| (-2_147_483_648..=2_147_483_647).contains(&number)),
        "Float" => value.is_number(),
        "ID" => value.is_string() || value.is_i64() || value.is_u64(),
        "DateTime" => value
            .as_str()
            .is_some_and(|text| chrono::DateTime::parse_from_rfc3339(text).is_ok()),
        "BigInt" => {
            value.is_i64()
                || value.is_u64()
                || value.as_str().is_some_and(|text| {
                    let digits = text.strip_prefix('-').unwrap_or(text);
                    !digits.is_empty() && digits.chars().all(|character| character.is_ascii_digit())
                })
        }
        "JSON" => true,
        "Port" => value
            .as_u64()
            .is_some_and(|port| (1..=65_535).contains(&port)),
        "URL" => value
            .as_str()
            .is_some_and(|text| url::Url::parse(text).is_ok()),
        _ => true,
    };
    if valid {
        Ok(())
    } else {
        Err(ValidationError::InvalidValue {
            path: path.to_string(),
            reason: format!("value does not match scalar {name}"),
        })
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use serde_json::{Map, json};

    use crate::mcp::dynamic::{
        config::DynamicMcpConfig, introspection::IntrospectionResponse, normalize::normalize_type,
        schema::TypeRegistry, types::TypeName,
    };

    use super::validate_arguments;

    const FIXTURE: &str = include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json");

    fn registry() -> TypeRegistry {
        let response: IntrospectionResponse = serde_json::from_str(FIXTURE).unwrap();
        TypeRegistry::new(
            response
                .data
                .unwrap()
                .aliases
                .into_values()
                .flatten()
                .map(|wire| {
                    let name = TypeName::new(wire.name.clone().unwrap()).unwrap();
                    (name.clone(), normalize_type(name, wire).unwrap())
                })
                .collect::<BTreeMap<_, _>>(),
        )
    }

    #[test]
    fn dynamic_validation_requires_non_null_arguments_and_rejects_unknowns() {
        let registry = registry();
        let query = registry.object(&TypeName::new("Query").unwrap()).unwrap();
        let disk = query
            .fields
            .iter()
            .find(|field| field.name.as_str() == "disk")
            .unwrap();
        assert!(
            validate_arguments(
                &disk.arguments,
                &Map::new(),
                &registry,
                &DynamicMcpConfig::default(),
            )
            .is_err()
        );
        assert!(
            validate_arguments(
                &disk.arguments,
                &Map::from_iter([("wat".to_string(), json!(1))]),
                &registry,
                &DynamicMcpConfig::default(),
            )
            .is_err()
        );
        validate_arguments(
            &disk.arguments,
            &Map::from_iter([("id".to_string(), json!("disk-1"))]),
            &registry,
            &DynamicMcpConfig::default(),
        )
        .unwrap();
    }
}
