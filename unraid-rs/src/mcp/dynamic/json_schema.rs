//! GraphQL input and output projection into JSON Schema.

use std::collections::{BTreeMap, BTreeSet};

use serde_json::{Map, Value, json};

use super::{
    config::DynamicMcpConfig,
    schema::{InputValue, TypeDefinition, TypeRegistry},
    types::{TypeName, TypeRef},
};

/// JSON Schema generation failure.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum JsonSchemaError {
    #[error("schema type {0} is missing")]
    MissingType(TypeName),
    #[error("unsupported input scalar {0}")]
    UnsupportedScalar(TypeName),
    #[error("input type {0} is not valid in an argument")]
    InvalidInputType(TypeName),
    #[error("input schema exceeds maximum depth {0}")]
    InputDepth(usize),
    #[error("cyclic input object {0}")]
    InputCycle(TypeName),
}

/// Generate the MCP input schema for one GraphQL operation.
pub fn operation_input_schema(
    arguments: &[InputValue],
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
) -> Result<Map<String, Value>, JsonSchemaError> {
    let mut properties = Map::new();
    let mut required = Vec::new();
    let mut stack = BTreeSet::new();
    for argument in arguments {
        let schema = input_type_schema(
            &argument.ty,
            registry,
            config,
            0,
            &mut stack,
            argument.description.as_deref(),
        )?;
        properties.insert(argument.name.to_string(), schema);
        if matches!(argument.ty, TypeRef::NonNull(_)) && argument.default_literal.is_none() {
            required.push(Value::String(argument.name.to_string()));
        }
    }
    properties.insert(
        "select".to_string(),
        json!({
            "type": "array",
            "description": "Optional validated dotted response field paths.",
            "items": { "type": "string", "minLength": 1 },
            "maxItems": config.max_selected_fields,
            "uniqueItems": true
        }),
    );
    let mut object = Map::from_iter([
        ("type".to_string(), json!("object")),
        ("properties".to_string(), Value::Object(properties)),
        ("additionalProperties".to_string(), json!(false)),
    ]);
    if !required.is_empty() {
        object.insert("required".to_string(), Value::Array(required));
    }
    Ok(object)
}

/// Generate a bounded JSON Schema for an operation result.
pub fn operation_output_schema(
    return_type: &TypeRef,
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
) -> Result<Map<String, Value>, JsonSchemaError> {
    let schema = output_type_schema(return_type, registry, config, 0)?;
    match schema {
        Value::Object(object) => Ok(object),
        other => Ok(Map::from_iter([("oneOf".to_string(), json!([other]))])),
    }
}

fn input_type_schema(
    ty: &TypeRef,
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
    depth: usize,
    stack: &mut BTreeSet<TypeName>,
    description: Option<&str>,
) -> Result<Value, JsonSchemaError> {
    let (ty, allow_null) = match ty {
        TypeRef::NonNull(inner) => (inner.as_ref(), false),
        other => (other, true),
    };
    input_type_schema_inner(ty, allow_null, registry, config, depth, stack, description)
}

#[allow(clippy::too_many_arguments)]
fn input_type_schema_inner(
    ty: &TypeRef,
    allow_null: bool,
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
    depth: usize,
    stack: &mut BTreeSet<TypeName>,
    description: Option<&str>,
) -> Result<Value, JsonSchemaError> {
    if depth > config.max_input_depth {
        return Err(JsonSchemaError::InputDepth(config.max_input_depth));
    }
    let mut schema = match ty {
        TypeRef::NonNull(inner) => {
            return input_type_schema_inner(
                inner,
                false,
                registry,
                config,
                depth,
                stack,
                description,
            );
        }
        TypeRef::List(inner) => {
            let item_schema = input_type_schema(inner, registry, config, depth + 1, stack, None)?;
            if allow_null {
                json!({
                    "type": ["array", "null"],
                    "items": item_schema,
                    "maxItems": config.max_array_items
                })
            } else {
                json!({
                    "type": "array",
                    "items": item_schema,
                    "maxItems": config.max_array_items
                })
            }
        }
        TypeRef::Named(name) => {
            let definition = registry
                .require(name)
                .map_err(|_| JsonSchemaError::MissingType(name.clone()))?;
            let required_schema = match definition {
                TypeDefinition::Scalar(_) => scalar_schema(name, config)?,
                TypeDefinition::Enum(value) => json!({
                    "type": "string",
                    "enum": value.values.iter().map(|item| item.name.to_string()).collect::<Vec<_>>()
                }),
                TypeDefinition::InputObject(value) => {
                    if !stack.insert(name.clone()) {
                        return Err(JsonSchemaError::InputCycle(name.clone()));
                    }
                    let mut properties = Map::new();
                    let mut required = Vec::new();
                    for field in &value.fields {
                        properties.insert(
                            field.name.to_string(),
                            input_type_schema(
                                &field.ty,
                                registry,
                                config,
                                depth + 1,
                                stack,
                                field.description.as_deref(),
                            )?,
                        );
                        if matches!(field.ty, TypeRef::NonNull(_))
                            && field.default_literal.is_none()
                        {
                            required.push(Value::String(field.name.to_string()));
                        }
                    }
                    stack.remove(name);
                    let mut object = Map::from_iter([
                        ("type".to_string(), json!("object")),
                        ("properties".to_string(), Value::Object(properties)),
                        ("additionalProperties".to_string(), json!(false)),
                    ]);
                    if !required.is_empty() {
                        object.insert("required".to_string(), Value::Array(required));
                    }
                    Value::Object(object)
                }
                _ => return Err(JsonSchemaError::InvalidInputType(name.clone())),
            };
            if allow_null {
                nullable(required_schema)
            } else {
                required_schema
            }
        }
    };
    if let Some(description) = description
        && let Value::Object(object) = &mut schema
    {
        object.insert("description".to_string(), json!(description));
    }
    Ok(schema)
}

fn scalar_schema(name: &TypeName, config: &DynamicMcpConfig) -> Result<Value, JsonSchemaError> {
    let schema = match name.as_str() {
        "String" | "PrefixedID" => json!({ "type": "string" }),
        "Boolean" => json!({ "type": "boolean" }),
        "Int" => json!({
            "type": "integer",
            "minimum": -2147483648_i64,
            "maximum": 2147483647_i64
        }),
        "Float" => json!({ "type": "number" }),
        "ID" => json!({
            "oneOf": [{ "type": "string" }, { "type": "integer" }]
        }),
        "DateTime" => json!({ "type": "string", "format": "date-time" }),
        "BigInt" => json!({
            "oneOf": [
                { "type": "integer" },
                { "type": "string", "pattern": "^-?[0-9]+$" }
            ]
        }),
        "JSON" => json!({}),
        "Port" => json!({ "type": "integer", "minimum": 1, "maximum": 65535 }),
        "URL" => json!({ "type": "string", "format": "uri" }),
        other => config
            .scalar_schemas
            .get(other)
            .cloned()
            .ok_or_else(|| JsonSchemaError::UnsupportedScalar(name.clone()))?,
    };
    Ok(schema)
}

fn nullable(schema: Value) -> Value {
    match schema {
        Value::Object(mut object) if object.get("type").is_some_and(Value::is_string) => {
            let original = object.remove("type").expect("checked type");
            object.insert("type".to_string(), json!([original, "null"]));
            Value::Object(object)
        }
        other => json!({ "anyOf": [other, { "type": "null" }] }),
    }
}

fn output_type_schema(
    ty: &TypeRef,
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
    depth: u8,
) -> Result<Value, JsonSchemaError> {
    let (ty, allow_null) = match ty {
        TypeRef::NonNull(inner) => (inner.as_ref(), false),
        other => (other, true),
    };
    output_type_schema_inner(ty, allow_null, registry, config, depth)
}

fn output_type_schema_inner(
    ty: &TypeRef,
    allow_null: bool,
    registry: &TypeRegistry,
    config: &DynamicMcpConfig,
    depth: u8,
) -> Result<Value, JsonSchemaError> {
    match ty {
        TypeRef::NonNull(inner) => output_type_schema_inner(inner, false, registry, config, depth),
        TypeRef::List(inner) => {
            let items = output_type_schema(inner, registry, config, depth)?;
            Ok(if allow_null {
                json!({ "type": ["array", "null"], "items": items })
            } else {
                json!({ "type": "array", "items": items })
            })
        }
        TypeRef::Named(name) => {
            let definition = registry
                .require(name)
                .map_err(|_| JsonSchemaError::MissingType(name.clone()))?;
            let schema = match definition {
                TypeDefinition::Scalar(_) => scalar_schema(name, config)?,
                TypeDefinition::Enum(value) => json!({
                    "type": "string",
                    "enum": value.values.iter().map(|item| item.name.to_string()).collect::<Vec<_>>()
                }),
                TypeDefinition::Object(value) if depth < config.max_selection_depth => {
                    let mut properties = BTreeMap::new();
                    for field in &value.fields {
                        if field.arguments.is_empty() {
                            properties.insert(
                                field.name.to_string(),
                                output_type_schema(&field.ty, registry, config, depth + 1)?,
                            );
                        }
                    }
                    json!({
                        "type": "object",
                        "properties": properties,
                        "additionalProperties": true
                    })
                }
                TypeDefinition::Object(_)
                | TypeDefinition::Interface(_)
                | TypeDefinition::Union(_) => {
                    json!({ "type": "object", "additionalProperties": true })
                }
                TypeDefinition::InputObject(_) => {
                    return Err(JsonSchemaError::InvalidInputType(name.clone()));
                }
            };
            Ok(if allow_null { nullable(schema) } else { schema })
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use serde_json::json;

    use crate::mcp::dynamic::{
        config::DynamicMcpConfig, introspection::IntrospectionResponse, normalize::normalize_type,
        schema::TypeRegistry, types::TypeName,
    };

    use super::operation_input_schema;

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
    fn dynamic_json_schema_marks_non_null_arguments_required() {
        let registry = registry();
        let query = registry.object(&TypeName::new("Query").unwrap()).unwrap();
        let disk = query
            .fields
            .iter()
            .find(|field| field.name.as_str() == "disk")
            .unwrap();
        let schema =
            operation_input_schema(&disk.arguments, &registry, &DynamicMcpConfig::default())
                .unwrap();
        assert_eq!(schema["required"], json!(["id"]));
        assert_eq!(schema["additionalProperties"], json!(false));
        assert!(schema["properties"]["select"].is_object());
    }

    #[test]
    fn dynamic_json_schema_rejects_unknown_input_scalar_without_adapter() {
        let mut definitions = registry().types().clone();
        let unknown = TypeName::new("Mystery").unwrap();
        definitions.insert(
            unknown.clone(),
            crate::mcp::dynamic::schema::TypeDefinition::Scalar(
                crate::mcp::dynamic::schema::ScalarType {
                    name: unknown.clone(),
                    description: None,
                    specified_by_url: None,
                },
            ),
        );
        let argument = crate::mcp::dynamic::schema::InputValue {
            name: crate::mcp::dynamic::types::FieldName::new("value").unwrap(),
            description: None,
            ty: crate::mcp::dynamic::types::TypeRef::Named(unknown),
            default_literal: None,
            deprecation: None,
        };
        assert!(
            operation_input_schema(
                &[argument],
                &TypeRegistry::new(definitions),
                &DynamicMcpConfig::default(),
            )
            .is_err()
        );
    }
}
